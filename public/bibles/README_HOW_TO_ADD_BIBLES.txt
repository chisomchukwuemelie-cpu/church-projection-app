HOW TO ADD CUSTOM BIBLES (NIV, AMP, MSG, ETC.)
================================================

Since some Bible translations like Amplified (AMP) or The Message (MSG) are copyrighted,
we cannot include them automatically. You must add them yourself.

INSTRUCTIONS:
1. Find the JSON content for your desired translation (Search Google/GitHub).
2. Create a new file in this folder named appropriately:
   - amp.json
   - niv.json
   - msg.json
   - nlt.json
   etc.
3. Paste the JSON content into that file.

REQUIRED JSON FORMAT:
The app expects the file to look EXACTLY like this structure:

[
  {
    "name": "Genesis",
    "chapters": [
      [
        "In the beginning God created the heaven and the earth.", 
        "And the earth was without form, and void..."
      ],
      [
        "Thus the heavens and the earth were finished...",
        "And on the seventh day..."
      ]
    ]
  },
  {
    "name": "Exodus",
    "chapters": [...]
  }
]

EXPLANATION:
- An Array `[]` of Book Objects.
- Each Book Object has "name" and "chapters".
- "chapters" is an Array of Arrays (Chapter 1, Chapter 2...).
- Inside each Chapter is an Array of Strings (Verse 1, Verse 2...).

SEARCH TIPS:
- Search GitHub for: "bible json [version] single file"
- Look for repositories like "thiagobodruk/bible" or similar that share this format.
- If you find a different format (like SQL or separate files), you will need to convert it to this JSON format first.
