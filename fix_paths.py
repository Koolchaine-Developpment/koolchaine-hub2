import os
fpath = "backend/app/api/social.py"
with open(fpath, "r") as f:
    text = f.read()

# Make DATA_DIR explicit
text = text.replace('DATA_DIR = "data"', 'DATA_DIR = os.path.abspath("data")')

# Replace media strings
text = text.replace('"media"', 'os.path.abspath("media")')
text = text.replace('"media/"', 'os.path.abspath("media") + "/"')
text = text.replace('f"media/{', 'f"{os.path.abspath(\'media\')}/{')

# Also the caption_memory.json path
text = text.replace('CAPTION_MEMORY_FILE = "caption_memory.json"', 'CAPTION_MEMORY_FILE = os.path.join(DATA_DIR, "caption_memory.json")')

# Remove duplicate scheduler logic completely since it will be in tasks.py
import re
text = re.sub(r'scheduler = BackgroundScheduler\(\).*?def refresh_analytics_job.*?:\s+.*?#.*?(?=\n\n# --- ROUTES ---)', '', text, flags=re.DOTALL)
# The above regex might be too reckless. Let's just comment it out.
text = text.replace("scheduler.start()", "# scheduler.start()")

with open(fpath, "w") as f:
    f.write(text)

print("Paths fixed.")
