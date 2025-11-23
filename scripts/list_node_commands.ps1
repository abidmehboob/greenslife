Get-Process node | ForEach-Object { $p = $_; $c = Get-CimInstance Win32_Process -Filter "ProcessId=$($p.Id)" | Select-Object ProcessId, CommandLine; if ($c) { Write-Output ("PID {0}: {1}" -f $c.ProcessId, $c.CommandLine) } }

