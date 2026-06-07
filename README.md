# 📖 Groq AI Calibre Reader Companion

An AI-powered custom dictionary for the Calibre E-book Viewer. Built with Next.js, powered by Groq (`llama-3.1-8b-instant`), and enhanced with live Wikipedia hover images and conversation tracking.

## ✨ Features
* **AI Summary & Vocabulary:** Automatically parses highlighted text into summaries, advanced definitions, and deep context.
* **Wikipedia Hover Previews:** Hovering over key nouns dynamically pulls up optimized illustration cards from Wikipedia.
* **Persistent Chat:** Continue exploring text passages with an ongoing contextual chat stream.
* **Space-Saving Accordion:** Large paragraph selections fold away automatically to preserve sidebar space.

---

## 🚀 Quick Setup & Deployment (2 Minutes)

### 1. Clone & Install
```bash
git clone [https://github.com/YOUR_USERNAME/calibre-ai-dict.git](https://github.com/YOUR_USERNAME/calibre-ai-dict.git)
cd calibre-ai-dict
npm install
```

### 2. Environment Variables
Create a .env.local file in the root directory and add your Groq API Key:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Deploy to Vercel
	1.	Push this repository to your GitHub account.
	2.	Import the repository into Vercel.
	3.	Add GROQ_API_KEY under the Environment Variables settings during deployment.
	4.	Click Deploy and copy your production URL.

## 🔌 Connecting to Calibre
	1.	Open any book inside the Calibre E-book Viewer.
	2.	Right-click anywhere and open Preferences (Gear Icon) -> Dictionaries.
	3.	Click Add Dictionary and apply the following settings:
    •	Name: Groq AI Reader
    •	URL: https://your-vercel-domain.vercel.app/?word={word}
	4.	Click OK and hit Save. Highlight any text to begin!
