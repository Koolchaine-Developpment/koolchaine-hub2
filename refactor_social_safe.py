import os

fpath = "backend/app/api/social.py"
with open(fpath, "r") as f:
    text = f.read()

# 1. FastAPI -> APIRouter
text = text.replace("from fastapi import FastAPI", "from fastapi import APIRouter")
text = text.replace("app = FastAPI()", "router = APIRouter()")
text = text.replace("@app.", "@router.")

# 2. Imports of services
text = text.replace("import meta_publisher", "import app.services.meta_publisher as meta_publisher")
text = text.replace("import content_generator", "import app.services.content_generator as content_generator")
text = text.replace("import drive_client", "import app.services.drive_client as drive_client")

# 3. Use standard dependencies
text = text.replace("check_hub_auth", "get_current_user")
text = text.replace("from fastapi import Depends", "from fastapi import Depends\nfrom app.api.deps import get_current_user")

# 4. Serve images: ensure GET /api/v1/image/{item_id} or GET /image/{item_id} returns FileResponse
text = text.replace("from fastapi.responses import HTMLResponse, StreamingResponse", "from fastapi.responses import HTMLResponse, StreamingResponse, FileResponse")

# 5. Remove StaticFiles mounting to avoid conflicts
text = text.replace('router.mount("/media"', '# router.mount("/media"')
text = text.replace('router.mount("/static"', '# router.mount("/static"')

# 6. Change all "@router.get("/api/" to just "/" since we mount this under /api/v1
text = text.replace('@router.get("/api/', '@router.get("/')
text = text.replace('@router.post("/api/', '@router.post("/')
text = text.replace('@router.put("/api/', '@router.put("/')
text = text.replace('@router.delete("/api/', '@router.delete("/')
text = text.replace('@router.patch("/api/', '@router.patch("/')

# 7. Make Paths absolute relative to backend root
text = text.replace('DATA_DIR = "data"', 'DATA_DIR = os.path.abspath("data")')
text = text.replace('"media"', 'os.path.abspath("media")')
text = text.replace('"media/"', 'os.path.abspath("media") + "/"')
text = text.replace('f"media/{', 'f"{os.path.abspath(\'media\')}/{')

# Also the caption_memory.json path
text = text.replace('CAPTION_MEMORY_FILE = "caption_memory.json"', 'CAPTION_MEMORY_FILE = os.path.join(DATA_DIR, "caption_memory.json")')

# 8. Deactivate local scheduler start (main Hub scheduler will handle it)
text = text.replace('scheduler.start()', '# scheduler.start()')
text = text.replace('@router.on_event("startup")', '# @router.on_event("startup")')

with open(fpath, "w") as f:
    f.write(text)

print("Router migration substitutions completed safely.")
