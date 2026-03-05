import os

frontend_src_dir = "frontend/src"

replacements = [
    ("/insta/api/", "/api/v1/"),
    ("/insta/image/", "/api/v1/image/"),
    ("/insta/validate/", "/api/v1/validate/"),
    ("/insta/reject/", "/api/v1/reject/")
]

files_updated = 0
for root, _, files in os.walk(frontend_src_dir):
    for filename in files:
        if filename.endswith(".jsx") or filename.endswith(".js"):
            filepath = os.path.join(root, filename)
            with open(filepath, "r") as f:
                content = f.read()

            new_content = content
            for old, new in replacements:
                new_content = new_content.replace(old, new)

            if new_content != content:
                with open(filepath, "w") as f:
                    f.write(new_content)
                files_updated += 1
                print(f"Updated: {filepath}")

print(f"Done. Updated {files_updated} files.")
