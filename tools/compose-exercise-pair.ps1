param(
  [Parameter(Mandatory=$true)][string]$Lower,
  [Parameter(Mandatory=$true)][string]$Raised,
  [Parameter(Mandatory=$true)][string]$Output,
  [switch]$Contain
)

Add-Type -AssemblyName System.Drawing
$board = New-Object System.Drawing.Bitmap 1536, 1024
$graphics = [System.Drawing.Graphics]::FromImage($board)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.Clear([System.Drawing.Color]::FromArgb(215, 214, 213))
try {
  $paths = @($Lower, $Raised)
  for ($index = 0; $index -lt $paths.Length; $index++) {
    $source = [System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $paths[$index]).Path)
    try {
      $scale = if ($Contain) { [Math]::Min(768.0 / $source.Width, 1024.0 / $source.Height) } else { [Math]::Max(768.0 / $source.Width, 1024.0 / $source.Height) }
      $width = [int][Math]::Round($source.Width * $scale)
      $height = [int][Math]::Round($source.Height * $scale)
      $x = [int]($index * 768 + (768 - $width) / 2)
      $y = [int]((1024 - $height) / 2)
      $graphics.DrawImage($source, (New-Object System.Drawing.Rectangle $x, $y, $width, $height))
    } finally {
      $source.Dispose()
    }
  }
  $graphics.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(167,165,164))), 767, 0, 2, 1024)
  $board.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $graphics.Dispose()
  $board.Dispose()
}
