param(
  [int]$Port = 19006,
  [string]$Out = "expo-web.log",
  [string]$Err = "expo-web.err.log"
)

$ErrorActionPreference = 'Stop'
$env:CI = 1

# 运行 Expo Web 预览（此脚本通常由 Start-Process 后台启动）
# 注意：该命令会持续运行，输出写入日志文件。
npx expo start --web --clear --port $Port --max-workers 2 1>> $Out 2>> $Err

