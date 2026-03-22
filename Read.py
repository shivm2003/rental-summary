import os

def generate_tree_structure(base_path, output_file, excluded_folders=None, excluded_files=None, image_extensions=None):
    """
    Creates a visual file tree with ├─ │ └─ characters, 
    copies text file contents, and lists image paths.
    """

    if excluded_folders is None:
        excluded_folders = {"node_modules", ".git", ".venv", "__pycache__", "dist", "build"}

    if excluded_files is None:
        excluded_files = {"package.json", "package-lock.json", "yarn.lock", ".DS_Store", ".css"}

    if image_extensions is None:
        image_extensions = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".svg", ".webp"}

    def build_tree(folder_path, prefix=""):
        """Recursively build folder tree lines."""
        entries = [e for e in os.listdir(folder_path) if e not in excluded_files]
        entries.sort()

        # Filter out excluded folders
        entries = [e for e in entries if e not in excluded_folders]

        lines = []
        for i, entry in enumerate(entries):
            path = os.path.join(folder_path, entry)
            connector = "└─ " if i == len(entries) - 1 else "├─ "
            if os.path.isdir(path):
                lines.append(f"{prefix}{connector}{entry}/")
                new_prefix = prefix + ("   " if i == len(entries) - 1 else "│  ")
                lines.extend(build_tree(path, new_prefix))
            else:
                lines.append(f"{prefix}{connector}{entry}")
        return lines

    with open(output_file, "w", encoding="utf-8") as f_out:
        # Generate visual folder tree
        f_out.write(f"{os.path.basename(base_path) or base_path}\n")
        tree_lines = build_tree(base_path)
        for line in tree_lines:
            f_out.write(line + "\n")

        f_out.write("\n\n===== FILE CONTENTS =====\n\n")

        # Walk again to copy contents / image paths
        for root, dirs, files in os.walk(base_path):
            dirs[:] = [d for d in dirs if d not in excluded_folders]
            for file in files:
                if file in excluded_files:
                    continue
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, base_path)
                _, ext = os.path.splitext(file)
                ext = ext.lower()

                f_out.write(f"[File] {rel_path}\n")

                if ext in image_extensions:
                    f_out.write(f"📸 Image Path: {file_path}\n\n")
                    continue

                try:
                    with open(file_path, "r", encoding="utf-8") as f_in:
                        content = f_in.read()
                    f_out.write("----- File Content Start -----\n")
                    f_out.write(content + "\n")
                    f_out.write("----- File Content End -----\n\n")
                except Exception as e:
                    f_out.write(f"!! Skipped (Unreadable or binary): {e}\n\n")

    print(f"✅ Tree and contents saved to '{output_file}'")


# === Example usage ===
base_path = r"C:\Users\shivam\Desktop\EveryThing Rental\17 Feb\backend"  # 👈 change this
output_file = "Backend1.txt"

generate_tree_structure(base_path, output_file)
