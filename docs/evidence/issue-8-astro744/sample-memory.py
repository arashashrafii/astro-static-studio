#!/usr/bin/env python3
"""Record aggregate Chrome process PSS and swap PSS from an Android device."""

import argparse
import datetime as dt
import json
import re
import subprocess
import time
from pathlib import Path


DEVICE = "emulator-5556"
CHROME_NAME = re.compile(r"chrome|chromium", re.I)
TOTAL_LINE = re.compile(r"^\s*TOTAL\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)(?:\s|$)", re.M)
TOTAL_PSS_LINE = re.compile(r"^\s*TOTAL\s+PSS:\s*([\d,]+)\s+kB\s+TOTAL\s+SWAP PSS:\s*([\d,]+)\s+kB", re.M | re.I)


def adb(*args, timeout=30):
    return subprocess.run(["adb", "-s", DEVICE, "shell", *args], text=True,
                          capture_output=True, timeout=timeout, check=True).stdout


def chrome_processes():
    output = adb("ps", "-A", "-o", "PID,NAME")
    found = []
    for line in output.splitlines()[1:]:
        fields = line.split(None, 1)
        if len(fields) == 2 and fields[0].isdigit() and CHROME_NAME.search(fields[1]):
            found.append((int(fields[0]), fields[1]))
    return found


def parse_totals(output):
    match = TOTAL_PSS_LINE.search(output)
    if match:
        return int(match.group(1).replace(",", "")), int(match.group(2).replace(",", ""))
    match = TOTAL_LINE.search(output)
    if match:
        # dumpsys TOTAL columns: PSS, Private Dirty, Private Clean, SwapPss,
        # Heap Size, Heap Alloc. The first and fourth columns are kB.
        return int(match.group(1)), int(match.group(4))
    raise ValueError("dumpsys meminfo output has no recognized TOTAL PSS row")


def sample():
    started = time.monotonic()
    timestamp = dt.datetime.now(dt.timezone.utc).isoformat()
    try:
        processes = chrome_processes()
        if not processes:
            raise RuntimeError("no Chrome processes found in ps -A -o PID,NAME")
        pss_total = swap_total = 0
        details = []
        for pid, name in processes:
            output = adb("dumpsys", "meminfo", str(pid), timeout=45)
            pss, swap = parse_totals(output)
            pss_total += pss
            swap_total += swap
            details.append({"pid": pid, "name": name, "pss_kb": pss, "swap_pss_kb": swap})
        return {"timestamp": timestamp, "duration_seconds": round(time.monotonic() - started, 3),
                "device": DEVICE, "process_count": len(details), "pss_kb": pss_total,
                "swap_pss_kb": swap_total, "processes": details}
    except Exception as exc:
        return {"timestamp": timestamp, "duration_seconds": round(time.monotonic() - started, 3),
                "device": DEVICE, "error": str(exc)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="JSONL output path")
    parser.add_argument("--interval", type=float, default=2.0, help="seconds between sample starts")
    parser.add_argument("--stop-file", type=Path, help="stop after this file exists")
    parser.add_argument("--once", action="store_true", help="write one sample and exit")
    args = parser.parse_args()
    if args.interval <= 0:
        parser.error("--interval must be positive")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    while True:
        began = time.monotonic()
        result = sample()
        with args.output.open("a", encoding="utf-8") as stream:
            stream.write(json.dumps(result, separators=(",", ":")) + "\n")
        print(json.dumps(result), flush=True)
        if args.once or (args.stop_file and args.stop_file.exists()):
            break
        time.sleep(max(0, args.interval - (time.monotonic() - began)))


if __name__ == "__main__":
    main()
