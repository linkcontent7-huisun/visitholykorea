// 영상에 음악 두 곡을 입힌다: A(바깥·성가) → T초 무렵 X초 동안 교차 → B(실내·오르간). 처음 페이드인, 끝 페이드아웃.
// 사용: swift mux2.swift <video.mp4> <musicA> <musicB> <out.mp4> <T> [X=4] [volA=0.8] [volB=0.9]
import AVFoundation
import Foundation

let a = CommandLine.arguments
guard a.count >= 6 else { print("usage: mux2 video A B out T [X] [volA] [volB]"); exit(1) }
let vURL = URL(fileURLWithPath: a[1]), aURL = URL(fileURLWithPath: a[2]), bURL = URL(fileURLWithPath: a[3]), outURL = URL(fileURLWithPath: a[4])
let T = Double(a[5]) ?? 40, X = a.count > 6 ? Double(a[6]) ?? 4 : 4
let volA = a.count > 7 ? Float(a[7]) ?? 0.8 : 0.8, volB = a.count > 8 ? Float(a[8]) ?? 0.9 : 0.9
let offB = a.count > 9 ? Double(a[9]) ?? 0 : 0
func t(_ s: Double) -> CMTime { CMTime(seconds: s, preferredTimescale: 600) }

let sem = DispatchSemaphore(value: 0)
Task {
  do {
    let video = AVURLAsset(url: vURL), A = AVURLAsset(url: aURL), B = AVURLAsset(url: bURL)
    let vDur = try await video.load(.duration), V = CMTimeGetSeconds(vDur)
    guard let vTrack = try await video.loadTracks(withMediaType: .video).first,
          let aTrack = try await A.loadTracks(withMediaType: .audio).first,
          let bTrack = try await B.loadTracks(withMediaType: .audio).first else { print("missing track"); exit(2) }
    let comp = AVMutableComposition()
    let cv = comp.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)!
    try cv.insertTimeRange(CMTimeRange(start: .zero, duration: vDur), of: vTrack, at: .zero)
    let ca = comp.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)!
    let cb = comp.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)!
    let aEnd = min(V, T + X / 2)
    try ca.insertTimeRange(CMTimeRange(start: .zero, duration: t(aEnd)), of: aTrack, at: .zero)
    let bStart = max(0, T - X / 2)
    try cb.insertTimeRange(CMTimeRange(start: t(offB), duration: t(V - bStart)), of: bTrack, at: t(bStart))
    let pa = AVMutableAudioMixInputParameters(track: ca)
    pa.setVolumeRamp(fromStartVolume: 0, toEndVolume: volA, timeRange: CMTimeRange(start: .zero, duration: t(2)))
    pa.setVolumeRamp(fromStartVolume: volA, toEndVolume: 0, timeRange: CMTimeRange(start: t(T - X / 2), duration: t(X)))
    let pb = AVMutableAudioMixInputParameters(track: cb)
    pb.setVolumeRamp(fromStartVolume: 0, toEndVolume: volB, timeRange: CMTimeRange(start: t(bStart), duration: t(X)))
    pb.setVolumeRamp(fromStartVolume: volB, toEndVolume: 0, timeRange: CMTimeRange(start: t(V - 4), duration: t(4)))
    let mix = AVMutableAudioMix(); mix.inputParameters = [pa, pb]
    try? FileManager.default.removeItem(at: outURL)
    guard let ex = AVAssetExportSession(asset: comp, presetName: AVAssetExportPresetHighestQuality) else { exit(4) }
    ex.audioMix = mix; ex.shouldOptimizeForNetworkUse = true
    try await ex.export(to: outURL, as: .mp4)
    print("ok", V)
  } catch { print("error:", error); exit(5) }
  sem.signal()
}
sem.wait()
