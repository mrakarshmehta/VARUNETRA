"""
Autonomous Copernicus GLO-30 DEM Acquisition Script for Patna Urban Basin.
Authoritative AOI: [25.570, 25.640] N, [85.080, 85.220] E
Tile: N25_00_E085_00 (1x1 degree tile covering Lat 25-26N, Lon 85-86E)
"""

import os
import sys
import urllib.request
import urllib.error
import time

RAW_DIR = os.path.join("data", "dem", "copernicus", "raw")
PILOT_DIR = os.path.join("data", "dem", "copernicus", "pilot")

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PILOT_DIR, exist_ok=True)

# Sources for Copernicus 30m DEM tile N25E085
CANDIDATE_URLS = [
    # 1. AWS Open Data (Public Copernicus GLO-30 Cloud Optimized GeoTIFF)
    (
        "AWS Open Data GLO-30 COG",
        "https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N25_00_E085_00_DEM/Copernicus_DSM_COG_10_N25_00_E085_00_DEM.tif",
        "Copernicus_DSM_COG_10_N25_00_E085_00_DEM.tif"
    ),
    # 2. OpenTopography Global DEM API (Clipped subset or full tile)
    (
        "OpenTopography API (COP30)",
        "https://portal.opentopography.org/API/globaldem?demtype=COP30&south=25.56&north=25.65&west=85.07&east=85.23&outputFormat=GTiff",
        "Copernicus_GLO30_Patna_AOI_subset.tif"
    )
]

def check_and_download():
    print(f"[*] Target Raw Directory: {os.path.abspath(RAW_DIR)}")
    print(f"[*] Target Pilot Directory: {os.path.abspath(PILOT_DIR)}")

    for label, url, filename in CANDIDATE_URLS:
        dest_path = os.path.join(RAW_DIR, filename)
        if os.path.exists(dest_path) and os.path.getsize(dest_path) > 100000:
            print(f"[+] File already exists locally: {dest_path} ({os.path.getsize(dest_path)} bytes)")
            return True, dest_path, label

        print(f"[*] Attempting acquisition from {label}...")
        print(f"    URL: {url}")
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "VARUNETRA-TerrainEngine/1.0 (PatnaUrbanBasin; SIH26085)"}
            )
            start_time = time.time()
            with urllib.request.urlopen(req, timeout=30) as resp:
                status = resp.status
                clength = resp.headers.get("Content-Length")
                print(f"    Connected (HTTP {status}), Content-Length: {clength}")

                total_read = 0
                with open(dest_path, "wb") as f:
                    while True:
                        chunk = resp.read(65536)
                        if not chunk:
                            break
                        f.write(chunk)
                        total_read += len(chunk)
                        if total_read % (1024 * 1024) == 0:
                            print(f"    Downloaded {total_read / (1024*1024):.1f} MB...")

            elapsed = time.time() - start_time
            print(f"[+] Download complete: {dest_path} ({total_read} bytes in {elapsed:.1f}s)")
            return True, dest_path, label

        except urllib.error.HTTPError as e:
            print(f"[-] HTTP Error {e.code}: {e.reason} from {label}")
        except urllib.error.URLError as e:
            print(f"[-] Network connection error: {e.reason} from {label}")
        except Exception as e:
            print(f"[-] Download failed: {e}")

    return False, None, None

if __name__ == "__main__":
    success, filepath, source = check_and_download()
    if not success:
        print("\n" + "="*60)
        print("[-] AUTONOMOUS DOWNLOAD BLOCKED: Network/Firewall Restriction")
        print("    Tile: N25_00_E085_00 (Patna Urban Basin)")
        print("    File Expected: Copernicus_DSM_COG_10_N25_00_E085_00_DEM.tif")
        print("    Target Path: data/dem/copernicus/raw/Copernicus_DSM_COG_10_N25_00_E085_00_DEM.tif")
        print("    Local Execution Command:")
        print("    curl -L -o data/dem/copernicus/raw/Copernicus_DSM_COG_10_N25_00_E085_00_DEM.tif https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N25_00_E085_00_DEM/Copernicus_DSM_COG_10_N25_00_E085_00_DEM.tif")
        print("="*60)
        sys.exit(1)
    else:
        print(f"\n[+] SUCCESS: Raw DEM available at {filepath}")
        sys.exit(0)
