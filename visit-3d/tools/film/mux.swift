// 영상(mp4)에 음악(mp3/m4a/wav)을 입힌다 — 영상 길이에 맞춰 자르고, 처음 1.5초 페이드인 · 끝 3초 페이드아웃.
// 사용: swift mux.swift <video.mp4> <music> <out.mp4> [음악시작초=0] [음량=0.9]
import AVFoundation
import Foundation

let a = CommandLine.arguments
guard a.count >= 4 else { print("usage: mux video music out [start] [volume]"); exit(1) }
let videoURL = URL(fileURLWithPath: a[1]), musicURL = URL(fileURLWithPath: a[2]), outURL = URL(fileURLWithPath: a[3])
let musicStart = a.count > 4 ? Double(a[4]) ?? 0 : 0
let volume = a.count > 5 ? Float(a[5]) ?? 0.9 : 0.9

let sem = DispatchSemaphore(value: 0)
Task {
  do {
    let video = AVURLAsset(url: videoURL), music = AVURLAsset(url: musicURL)
    let vDur = try await video.load(.duration)
    guard let vTrack = try await video.loadTracks(withMediaType: .video).first else { print("no video track"); exit(2) }
    guard let mTrack = try await music.loadTracks(withMediaType: .audio).first else { print("no audio track"); exit(3) }
    let mDur = try await music.load(.duration)
    let comp = AVMutableComposition()
    let cv = comp.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)!
    try cv.insertTimeRange(CMTimeRange(start: .zero, duration: vDur), of: vTrack, at: .zero)
    cv.preferredTransform = try await vTrack.load(.preferredTransform)
    let ca = comp.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)!
    let start = CMTime(seconds: musicStart, preferredTimescale: 600)
    let avail = CMTimeSubtract(mDur, start)
    let len = CMTimeMinimum(vDur, avail)
    try ca.insertTimeRange(CMTimeRange(start: start, duration: len), of: mTrack, at: .zero)
    // 음량: 페이드인 1.5초 · 페이드아웃 3초
    let p = AVMutableAudioMixInputParameters(track: ca)
    p.setVolumeRamp(fromStartVolume: 0, toEndVolume: volume, timeRange: CMTimeRange(start: .zero, duration: CMTime(seconds: 1.5, preferredTimescale: 600)))
    let outStart = CMTimeSubtract(len, CMTime(seconds: 3, preferredTimescale: 600))
    p.setVolume(volume, at: CMTime(seconds: 1.5, preferredTimescale: 600))
    p.setVolumeRamp(fromStartVolume: volume, toEndVolume: 0, timeRange: CMTimeRange(start: outStart, duration: CMTime(seconds: 3, preferredTimescale: 600)))
    let mix = AVMutableAudioMix(); mix.inputParameters = [p]
    try? FileManager.default.removeItem(at: outURL)
    guard let ex = AVAssetExportSession(asset: comp, presetName: AVAssetExportPresetHighestQuality) else { print("no export session"); exit(4) }
    ex.audioMix = mix
    ex.shouldOptimizeForNetworkUse = true
    try await ex.export(to: outURL, as: .mp4)
    print("ok", CMTimeGetSeconds(vDur), "s")
  } catch { print("error:", error); exit(5) }
  sem.signal()
}
sem.wait()
