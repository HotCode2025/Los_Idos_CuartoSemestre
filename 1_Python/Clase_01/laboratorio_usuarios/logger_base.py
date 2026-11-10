import logging as log
from pathlib import Path


LOG_FILE = Path(__file__).resolve().parent / "capa_datos.log"

log.basicConfig(
    level=log.INFO,
    format="%(asctime)s:%(levelname)s [%(filename)s:%(lineno)s] %(message)s",
    datefmt="%I:%M:%S %p",
    handlers=[
        log.FileHandler(LOG_FILE, encoding="utf-8"),
        log.StreamHandler(),
    ],
)

logger = log
