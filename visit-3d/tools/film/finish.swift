// finish.swift — 720p 녹화본을 1080p 로 키우고, 한글 자막(CATextLayer)과 음악(페이드인 1.5초·페이드아웃 3초)을 한 번에 입힌다. ffmpeg 없이 AVFoundation 만 쓴다.
// 사용: swift finish.swift <video.mp4> <music.mp3> <subs.json> <out.mp4> [음악시작초=0] [음량=0.9] [sfx.json: {"duck":[[t0,t1]],"sfx":[{"file","t","offset","len","vol"}]}]
// subs.json: [{"t0":1.0,"t1":4.5,"text":"자막","size":46,"pos":"bottom"}]  pos: bottom(가운데 아래) | corner(오른쪽 아래 작게)
import AVFoundation
import AppKit
import Foundation

struct Sub: Decodable { let t0: Double; let t1: Double; let text: String; let size: CGFloat?; let pos: String?; let y: CGFloat? }

let a = CommandLine.arguments
guard a.count >= 5 else { print("usage: finish video music subs.json out [start] [volume]"); exit(1) }
let videoURL = URL(fileURLWithPath: a[1]), musicURL = URL(fileURLWithPath: a[2]), subsURL = URL(fileURLWithPath: a[3]), outURL = URL(fileURLWithPath: a[4])
let musicStart = a.count > 5 ? Double(a[5]) ?? 0 : 0
let volume = a.count > 6 ? Float(a[6]) ?? 0.9 : 0.9
let subs = try JSONDecoder().decode([Sub].self, from: Data(contentsOf: subsURL))
let W: CGFloat = 1920, H: CGFloat = 1080

// 자막 한 장: 글자 + 반투명 검은 띠, 0.5초 페이드인·아웃 (CALayer 좌표는 왼쪽 아래가 원점)
func subtitleLayer(_ s: Sub) -> CALayer {
  let corner = s.pos == "corner"
  let size = s.size ?? (corner ? 26 : 46)
  let font = NSFont(name: "AppleSDGothicNeo-Bold", size: size) ?? NSFont.boldSystemFont(ofSize: size)
  let para = NSMutableParagraphStyle(); para.alignment = corner ? .right : .center
  let shadow = NSShadow(); shadow.shadowColor = NSColor.black.withAlphaComponent(0.9); shadow.shadowBlurRadius = 6; shadow.shadowOffset = CGSize(width: 0, height: -2)
  let attr = NSAttributedString(string: s.text, attributes: [.font: font, .foregroundColor: NSColor.white, .paragraphStyle: para, .shadow: shadow])
  let lines = CGFloat(s.text.split(separator: "\n").count)
  let textSize = attr.size()
  let padX: CGFloat = corner ? 18 : 34, padY: CGFloat = corner ? 10 : 16
  let boxW = textSize.width + padX * 2, boxH = textSize.height * lines + padY * 2
  let group = CALayer()
  let x = corner ? W - boxW - 40 : (W - boxW) / 2
  let y: CGFloat = s.y ?? (corner ? 36 : 72)
  group.frame = CGRect(x: x, y: y, width: boxW, height: boxH)
  // 글자는 비트맵으로 그려 넣는다 — CATextLayer 는 내보내기(AVAssetExportSession)에서 글자를 그리지 않았다
  let img = NSImage(size: CGSize(width: boxW, height: boxH), flipped: false) { rect in
    let path = NSBezierPath(roundedRect: rect, xRadius: corner ? 8 : 14, yRadius: corner ? 8 : 14)
    NSColor.black.withAlphaComponent(corner ? 0.45 : 0.38).setFill(); path.fill()
    attr.draw(in: CGRect(x: padX, y: padY, width: textSize.width + 2, height: textSize.height * lines + 4))
    return true
  }
  var rectV = CGRect(origin: .zero, size: img.size)
  group.contents = img.cgImage(forProposedRect: &rectV, context: nil, hints: nil)
  group.contentsGravity = .resize
  group.opacity = 0
  let dur = max(0.6, s.t1 - s.t0), f = min(0.5, dur / 3)
  let an = CAKeyframeAnimation(keyPath: "opacity")
  an.values = [0, 1, 1, 0]; an.keyTimes = [0, NSNumber(value: f / dur), NSNumber(value: 1 - f / dur), 1]
  an.beginTime = AVCoreAnimationBeginTimeAtZero + s.t0; an.duration = dur
  an.isRemovedOnCompletion = false; an.fillMode = .forwards
  group.add(an, forKey: "fade")
  return group
}

var finished = false
Task {
  do {
    let video = AVURLAsset(url: videoURL), music = AVURLAsset(url: musicURL)
    let vDur = try await video.load(.duration)
    guard let vTrack = try await video.loadTracks(withMediaType: .video).first else { print("no video track"); exit(2) }
    guard let mTrack = try await music.loadTracks(withMediaType: .audio).first else { print("no audio track"); exit(3) }
    let natural = try await vTrack.load(.naturalSize)
    let mDur = try await music.load(.duration)
    let comp = AVMutableComposition()
    let cv = comp.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)!
    try cv.insertTimeRange(CMTimeRange(start: .zero, duration: vDur), of: vTrack, at: .zero)
    let ca = comp.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)!
    let start = CMTime(seconds: musicStart, preferredTimescale: 600)
    let len = CMTimeMinimum(vDur, CMTimeSubtract(mDur, start))
    try ca.insertTimeRange(CMTimeRange(start: start, duration: len), of: mTrack, at: .zero)
    // 음량 페이드 + (선택) 종소리 구간에서 음악 끄기·효과음 얹기
    var duck: [(Double, Double)] = [], sfx: [[String: Any]] = []
    if a.count > 7, let d = try? Data(contentsOf: URL(fileURLWithPath: a[7])), let j = try? JSONSerialization.jsonObject(with: d) as? [String: Any] {
      duck = (j["duck"] as? [[Double]] ?? []).map { ($0[0], $0[1]) }.sorted { $0.0 < $1.0 }; sfx = j["sfx"] as? [[String: Any]] ?? []
    }
    let ts = { (x: Double) in CMTime(seconds: x, preferredTimescale: 600) }
    let p = AVMutableAudioMixInputParameters(track: ca)
    p.setVolumeRamp(fromStartVolume: 0, toEndVolume: volume, timeRange: CMTimeRange(start: .zero, duration: ts(1.5)))
    p.setVolume(volume, at: ts(1.5))
    for (t0, t1) in duck {
      p.setVolumeRamp(fromStartVolume: volume, toEndVolume: 0, timeRange: CMTimeRange(start: ts(t0), duration: ts(0.3)))
      p.setVolume(0, at: ts(t0 + 0.3))
      p.setVolumeRamp(fromStartVolume: 0, toEndVolume: volume, timeRange: CMTimeRange(start: ts(t1), duration: ts(2.5)))
      p.setVolume(volume, at: ts(t1 + 2.5))
    }
    p.setVolumeRamp(fromStartVolume: volume, toEndVolume: 0, timeRange: CMTimeRange(start: CMTimeSubtract(len, ts(3)), duration: ts(3)))
    var params = [p]
    for e in sfx {
      guard let file = e["file"] as? String, let tt = e["t"] as? Double else { continue }
      let asset = AVURLAsset(url: URL(fileURLWithPath: file))
      guard let st = try await asset.loadTracks(withMediaType: .audio).first else { continue }
      let off = e["offset"] as? Double ?? 0, ln = e["len"] as? Double ?? 2.6, vol = Float(e["vol"] as? Double ?? 1)
      let tr = comp.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)!
      try tr.insertTimeRange(CMTimeRange(start: ts(off), duration: ts(ln)), of: st, at: ts(tt))
      let sp = AVMutableAudioMixInputParameters(track: tr)
      sp.setVolume(vol, at: ts(tt)); sp.setVolumeRamp(fromStartVolume: vol, toEndVolume: 0, timeRange: CMTimeRange(start: ts(tt + ln - 1.1), duration: ts(1.1)))
      params.append(sp)
    }
    let mix = AVMutableAudioMix(); mix.inputParameters = params
    // 영상 합성: 1080p 로 확대 + 자막 레이어
    let vc = AVMutableVideoComposition()
    vc.renderSize = CGSize(width: W, height: H)
    vc.frameDuration = CMTime(value: 1, timescale: 30)
    let inst = AVMutableVideoCompositionInstruction(); inst.timeRange = CMTimeRange(start: .zero, duration: vDur)
    let li = AVMutableVideoCompositionLayerInstruction(assetTrack: cv)
    let sc = min(W / natural.width, H / natural.height)
    li.setTransform(CGAffineTransform(scaleX: sc, y: sc).translatedBy(x: (W / sc - natural.width) / 2, y: (H / sc - natural.height) / 2), at: .zero)
    inst.layerInstructions = [li]; vc.instructions = [inst]
    let parent = CALayer(); parent.frame = CGRect(x: 0, y: 0, width: W, height: H); parent.isGeometryFlipped = false
    let videoLayer = CALayer(); videoLayer.frame = parent.frame
    parent.addSublayer(videoLayer)
    for s in subs { parent.addSublayer(subtitleLayer(s)) }
    vc.animationTool = AVVideoCompositionCoreAnimationTool(postProcessingAsVideoLayer: videoLayer, in: parent)
    try? FileManager.default.removeItem(at: outURL)
    guard let ex = AVAssetExportSession(asset: comp, presetName: AVAssetExportPresetHighestQuality) else { print("no export session"); exit(4) }
    ex.audioMix = mix; ex.videoComposition = vc; ex.shouldOptimizeForNetworkUse = true
    try await ex.export(to: outURL, as: .mp4)
    print("ok", CMTimeGetSeconds(vDur), "s", subs.count, "subs")
  } catch { print("error:", error); exit(5) }
  finished = true
}
while !finished { RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.1)) }
