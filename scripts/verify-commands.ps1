# Read-only command execution. Raw machine output remains in memory only.
# Saved evidence contains outcomes, numeric counts, and public test targets.
param([string]$OutputPath = 'docs/command-execution.json', [ValidateSet('all','nslookup')][string]$Only = 'all')
$ErrorActionPreference = 'Stop'
$cases = @(
  @{id='ipconfig'; exe='ipconfig.exe'; args='/all'; label='ipconfig /all'},
  @{id='ping'; exe='ping.exe'; args='-4 -n 4 -w 1000 1.1.1.1'; label='ping -4 -n 4 -w 1000 1.1.1.1'},
  @{id='tracert'; exe='tracert.exe'; args='-4 -d -h 8 -w 500 1.1.1.1'; label='tracert -4 -d -h 8 -w 500 1.1.1.1'},
  @{id='nslookup'; exe='nslookup.exe'; args='-timeout=2 -retry=1 example.com'; label='nslookup -timeout=2 -retry=1 example.com'},
  @{id='route'; exe='route.exe'; args='print'; label='route print'},
  @{id='arp'; exe='arp.exe'; args='-a'; label='arp -a'},
  @{id='netstat'; exe='netstat.exe'; args='-ano'; label='netstat -ano'}
)
$results = foreach ($case in $cases) {
  if ($Only -ne 'all' -and $case.id -ne $Only) { continue }
  $info = [System.Diagnostics.ProcessStartInfo]::new()
  $info.FileName = Join-Path $env:SystemRoot "System32/$($case.exe)"
  $info.Arguments = $case.args
  $info.UseShellExecute = $false
  $info.CreateNoWindow = $true
  $info.RedirectStandardOutput = $true
  $info.RedirectStandardError = $true
  $process = [System.Diagnostics.Process]::new()
  $process.StartInfo = $info
  $timer = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    [void]$process.Start()
    $stdout = $process.StandardOutput.ReadToEndAsync()
    $stderr = $process.StandardError.ReadToEndAsync()
    $finished = $process.WaitForExit(20000)
    if (-not $finished) { $process.Kill(); $process.WaitForExit() }
    $raw = $stdout.GetAwaiter().GetResult() + "`n" + $stderr.GetAwaiter().GetResult()
    $metrics = [ordered]@{}
    $description = 'Output captured in memory; local identifiers omitted.'
    switch ($case.id) {
      'ipconfig' { $metrics.ipv4Fields = [regex]::Matches($raw,'IPv4 Address').Count; $description='Interface configuration output returned; hostnames, MACs, addresses and resolver details not saved.' }
      'ping' {
        $sample = [regex]::Match($raw,'Sent = (\d+), Received = (\d+), Lost = (\d+) \((\d+)% loss\)')
        if ($sample.Success) { $metrics.sent=[int]$sample.Groups[1].Value; $metrics.received=[int]$sample.Groups[2].Value; $metrics.lost=[int]$sample.Groups[3].Value; $metrics.lossPercent=[int]$sample.Groups[4].Value }
        $metrics.echoReplyLines = [regex]::Matches($raw,'Reply from 1\.1\.1\.1: bytes=').Count
        $description='Bounded ICMP sample to public 1.1.1.1; this does not test the example gateway 192.168.1.1.'
      }
      'tracert' { $metrics.hopRows=[regex]::Matches($raw,'(?m)^\s*\d+\s+').Count; $metrics.timeoutRows=[regex]::Matches($raw,'Request timed out').Count; $metrics.destinationSeen=[bool]($raw -match '(?m)^\s*\d+\s+.*\s1\.1\.1\.1\s*$'); $description='At most eight TTL steps. Missing destination in this bounded trace is not a routing-failure verdict.' }
      'nslookup' { $metrics.queryNameInAnswer=[bool]($raw -match 'Name:\s+example\.com'); $metrics.timeoutMessages=[regex]::Matches($raw,'timed out').Count; $description='Queried example.com through the configured resolver; resolver identity and answer addresses not saved.' }
      'route' { $metrics.ipv4RouteTable=[bool]($raw -match 'IPv4 Route Table'); $description='Routing table listing returned; interface identities and route destinations omitted.' }
      'arp' { $metrics.neighborRows=[regex]::Matches($raw,'(?m)^\s*\d+\.\d+\.\d+\.\d+\s+').Count; $description='Neighbor cache inspected; all addresses and MAC identifiers omitted. Empty caches are valid.' }
      'netstat' { $metrics.socketRows=[regex]::Matches($raw,'(?m)^\s*(TCP|UDP)\s+').Count; $description='Socket listing returned; endpoints and process IDs omitted.' }
    }
    [pscustomobject]@{id=$case.id;mode='Actual Windows execution';command=$case.label;completed=$finished;exitCode=if($finished){$process.ExitCode}else{$null};durationMs=$timer.ElapsedMilliseconds;metrics=$metrics;summary=$description}
  } catch {
    # Do not persist raw error strings, which can include machine-specific paths.
    [pscustomobject]@{id=$case.id;mode='Actual Windows execution attempt';command=$case.label;completed=$false;exitCode=$null;durationMs=$timer.ElapsedMilliseconds;metrics=@{};summary='Execution unavailable or denied; no raw machine data saved.'}
  } finally { $process.Dispose() }
}
$record = [ordered]@{runAtUtc=[DateTime]::UtcNow.ToString('o');platform='Windows';privacy='Raw output discarded; saved metrics contain no local addresses, hostnames, MACs or process IDs.';results=@($results)}
$record | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath
$results | ConvertTo-Json -Depth 6
