import AVFoundation
import AppKit
let a = CommandLine.arguments
let asset = AVURLAsset(url: URL(fileURLWithPath: a[1]))
let gen = AVAssetImageGenerator(asset: asset); gen.appliesPreferredTrackTransform = true
gen.requestedTimeToleranceBefore = .zero; gen.requestedTimeToleranceAfter = .zero
gen.maximumSize = CGSize(width: 960, height: 540)
for s in a.dropFirst(3) {
  let t = CMTime(seconds: Double(s)!, preferredTimescale: 600)
  if let cg = try? gen.copyCGImage(at: t, actualTime: nil) {
    let rep = NSBitmapImageRep(cgImage: cg)
    try? rep.representation(using: .jpeg, properties: [.compressionFactor: 0.8])!.write(to: URL(fileURLWithPath: "\(a[2])-\(s).jpg"))
  }
}
print("ok")
