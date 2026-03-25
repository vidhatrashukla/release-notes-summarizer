import React, { useState } from 'react';
import { Copy, Sparkles, Loader2, RefreshCw } from 'lucide-react';

interface GitHubRepo {
  owner: string;
  repo: string;
  field: 'osBE' | 'osFE' | 'proFE' | 'proNative';
  path?: string;
}

const REPO_CONFIGS: GitHubRepo[] = [
  { owner: 'FarMart-Engineering', repo: 'farmartos-backend', field: 'osBE' },
  { owner: 'FarMart-Engineering', repo: 'farmartos-frontend', field: 'osFE' },
  { owner: 'FarMart', repo: 'pro-app', field: 'proFE', path: 'packages/web/package.json' },
  { owner: 'FarMart', repo: 'pro-app', field: 'proNative', path: 'packages/native/package.json' }
];

export default function ReleaseNotesSummarizer() {
  const [formData, setFormData] = useState({
    osBE: '',
    osFE: '',
    proFE: '',
    proNative: '',
    releaseDate: '',
    releaseTime: '',
    ticketDetails: '',
    downtime: ''
  });
  
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fetchingVersions, setFetchingVersions] = useState<Record<string, boolean>>({});

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleInputChange = (e) => {
    const { name, value } = e;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchVersionFromGitHub = async (config: GitHubRepo) => {
    setFetchingVersions(prev => ({ ...prev, [config.field]: true }));
    setNotification(null);

    try {
      const packagePath = config.path || 'package.json';
      // Use raw GitHub URL to avoid CORS issues
      const branch = 'main'; // or 'master' depending on your default branch
      const rawUrl = `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${branch}/${packagePath}`;
      
      const response = await fetch(rawUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }

      const packageJson = await response.json();
      const version = packageJson.version;
      
      if (version) {
        handleInputChange({ name: config.field, value: version });
        setNotification({ type: 'success', message: `Fetched version ${version} from ${config.repo}` });
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({ type: 'error', message: `No version found in ${config.repo}` });
      }
    } catch (error) {
      console.error(`Error fetching version from ${config.repo}:`, error);
      setNotification({ 
        type: 'error', 
        message: `Failed to fetch from ${config.repo}: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setFetchingVersions(prev => ({ ...prev, [config.field]: false }));
    }
  };

  const fetchAllVersions = async () => {
    for (const config of REPO_CONFIGS) {
      await fetchVersionFromGitHub(config);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm}`;
  };

  const generateReleaseNotes = async () => {
    setIsGenerating(true);

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
      setGeneratedMessage("Error: API key not configured. Please add your Groq API key to the .env file. Get a free API key at https://console.groq.com");
      setIsGenerating(false);
      return;
    }

    const versionParts = [];
    if (formData.osBE) versionParts.push(`FarMart OS BE v${formData.osBE}`);
    if (formData.osFE) versionParts.push(`FE v${formData.osFE}`);
    if (formData.proFE) versionParts.push(`Pro FE v${formData.proFE}`);
    if (formData.proNative) versionParts.push(`Native ${formData.proNative}`);

    const versionLine = versionParts.join(' / ');

    // Format date and time
    const formattedDate = formatDate(formData.releaseDate);
    const formattedTime = formatTime(formData.releaseTime);
    
    // Determine release type
    const hasOS = formData.osBE || formData.osFE;
    const hasPro = formData.proFE || formData.proNative;
    const hasProNative = formData.proNative;
    
    // Build closing statement
    let closingStatement = '';
    const downtimeMap = {
      '15min': 'FarMart OS will not be accessible for approximately 15 minutes during this release.',
      '30min': 'FarMart OS will not be accessible for approximately 30 minutes during this release.',
      '1hour': 'FarMart OS will not be accessible for approximately 1 hour during this release.',
      'custom': 'FarMart OS will not be accessible during this release window.'
    };
    
    if (formData.downtime && formData.downtime !== '') {
      closingStatement = downtimeMap[formData.downtime] || downtimeMap['custom'];
    } else {
      closingStatement = 'There will be no downtime for this release.';
    }
    
    if (hasProNative) {
      if (closingStatement === 'There will be no downtime for this release.') {
        closingStatement = 'There will be no downtime for FarMart OS and FMT Pro users will need to update their apps once the release is complete.';
      } else {
        closingStatement += ' FMT Pro users will need to update their apps once the release is complete.';
      }
    }

    const prompt = `You are writing a release message for FarMart's internal team. The audience is non-technical end users of FarMart OS (web-based tool) and FarMart Pro (mobile app).

Version: ${versionLine}
Release Date: ${formattedDate}
Release Time: ${formattedTime}
Closing Statement: ${closingStatement}

Ticket Details:
${formData.ticketDetails}

Generate a release message following this EXACT format:

IMPORTANT - The message MUST follow this exact structure and use WhatsApp-compatible formatting (use asterisks * for bold, ensure proper spacing):

Line 1: 📱 ${versionLine}
Line 2: 📅 ${formattedDate}
Line 3: ⏰ ${formattedTime}

CRITICAL: Use plain text emojis (📱 📅 ⏰) WITHOUT any code blocks, backticks, or special wrappers. Do NOT wrap emojis in :: or any other characters. The emojis must copy directly as shown.

[Blank line]

*Subject:* [Create a clear subject line based on the nature of changes. If any ticket is a "story", "epic", or "feature", explicitly mention this in the subject line]

[Blank line]

Dear all,

We are making a *[RELEASE TYPE]* release which is aimed at [briefly state the main goal].

[RELEASE TYPE] should be one of:
- *MAJOR* - if introducing significant new features, breaking changes, or major system updates (e.g., new modules, major UI overhauls)
- *MINOR* - if introducing new features or substantial improvements without breaking changes
- *PATCH* - if primarily bug fixes, small tweaks, or performance optimizations with no new features

Explicitly call out the release type in the first paragraph using the exact word "MAJOR", "MINOR", or "PATCH" in uppercase with asterisks.

[Then organize the actual changes in numbered sections in this EXACT ORDER of magnitude:]

*1. New Features:*
   - [Detail 1]
   - [Detail 2]

*2. Improvements:*
   - [Detail 1]
   - [Detail 2]

*3. Bug Fixes:*
   - [Detail 1]
   - [Detail 2]

[Only include sections that have relevant changes. If there are no new features, skip that section.]

[Blank line]

${closingStatement}

Style guidelines:
- CRITICAL: Format must be WhatsApp-compatible - use *asterisks* for bold text
- Release type (MAJOR/MINOR/PATCH) must be explicitly stated in the first paragraph
- If any ticket is a story/epic/feature, highlight this in the subject line
- Bullet points must be ordered by magnitude: New Features first, Improvements second, Bug Fixes last
- Use simple, non-technical language focused on business impact
- Focus on WHAT changed and WHY it matters, not HOW it works
- Keep sentences clear and concise
- Group related changes together

Return ONLY the formatted release message, nothing else.`;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "user", content: prompt }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "API request failed");
      }

      const message = data.choices?.[0]?.message?.content || "No response generated";
      setGeneratedMessage(message);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setGeneratedMessage(`Error: ${errorMessage}`);
      console.error("Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canGenerate = formData.ticketDetails.trim() && formData.releaseDate && formData.releaseTime;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Release Notes Summarizer</h1>
          <p className="text-gray-600">Generate professional release messages for your internal applications</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            
            {notification && (
              <div className={`mb-4 p-3 rounded-md text-sm ${
                notification.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {notification.message}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Release Information</h2>
                <button
                  onClick={fetchAllVersions}
                  disabled={Object.values(fetchingVersions).some(v => v)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
                >
                  {Object.values(fetchingVersions).some(v => v) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Fetch All Versions
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Backend Version
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="osBE"
                      value={formData.osBE}
                      onChange={(e) => handleInputChange(e.target)}
                      placeholder="e.g., 4.3.1"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => fetchVersionFromGitHub(REPO_CONFIGS[0])}
                      disabled={fetchingVersions['osBE']}
                      className="px-2 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                      title="Fetch from farmartos-backend"
                    >
                      {fetchingVersions['osBE'] ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Web App Version
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="osFE"
                      value={formData.osFE}
                      onChange={(e) => handleInputChange(e.target)}
                      placeholder="e.g., 12.3.1"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => fetchVersionFromGitHub(REPO_CONFIGS[1])}
                      disabled={fetchingVersions['osFE']}
                      className="px-2 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                      title="Fetch from farmartos-frontend"
                    >
                      {fetchingVersions['osFE'] ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile App Version
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="proFE"
                      value={formData.proFE}
                      onChange={(e) => handleInputChange(e.target)}
                      placeholder="e.g., 3.0.1"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => fetchVersionFromGitHub(REPO_CONFIGS[2])}
                      disabled={fetchingVersions['proFE']}
                      className="px-2 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                      title="Fetch from pro-app (web)"
                    >
                      {fetchingVersions['proFE'] ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Native Build Version
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="proNative"
                      value={formData.proNative}
                      onChange={(e) => handleInputChange(e.target)}
                      placeholder="e.g., 10.2.0"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => fetchVersionFromGitHub(REPO_CONFIGS[3])}
                      disabled={fetchingVersions['proNative']}
                      className="px-2 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                      title="Fetch from pro-app (native)"
                    >
                      {fetchingVersions['proNative'] ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Release Date *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      name="releaseDate"
                      value={formData.releaseDate}
                      onChange={(e) => handleInputChange(e.target)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => {
                        const today = new Date().toISOString().split('T')[0];
                        handleInputChange({ name: 'releaseDate', value: today });
                      }}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      Today
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Release Time *
                  </label>
                  <input
                    type="time"
                    name="releaseTime"
                    value={formData.releaseTime}
                    onChange={(e) => handleInputChange(e.target)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Downtime for Web Application
                </label>
                <select
                  name="downtime"
                  value={formData.downtime}
                  onChange={(e) => handleInputChange(e.target)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No downtime</option>
                  <option value="15min">15 minutes</option>
                  <option value="30min">30 minutes</option>
                  <option value="1hour">1 hour</option>
                  <option value="custom">Custom (specify in message)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ticket Details *
                  {!formData.ticketDetails.trim() && (
                    <span className="text-red-500 ml-1">(required)</span>
                  )}
                </label>
                <textarea
                  name="ticketDetails"
                  value={formData.ticketDetails}
                  onChange={(e) => handleInputChange(e.target)}
                  placeholder="Paste ticket headers and descriptions here. Include details about what changed and why it matters."
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include Jira tickets, PR descriptions, or release notes
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={generateReleaseNotes}
                  disabled={!canGenerate || isGenerating}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Release Message
                    </>
                  )}
                </button>
                {!canGenerate && (
                  <p className="text-xs text-gray-500 text-center">
                    Fill in Date, Time, and Ticket Details to generate
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Generated Message</h2>
              {generatedMessage && (
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>

            <div className="bg-gray-50 rounded-md p-4 min-h-[500px] max-h-[700px] overflow-y-auto">
              {generatedMessage ? (
                <textarea
                  readOnly
                  value={generatedMessage}
                  className="w-full h-full min-h-[480px] bg-transparent font-sans text-sm text-gray-800 resize-none focus:outline-none"
                  style={{ whiteSpace: 'pre-wrap' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Fill in the details and click generate to create your release message</p>
                  </div>
                </div>
              )}
            </div>

            {generatedMessage && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Review the generated message and edit as needed before sharing. Add CC mentions at the end.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Created by{' '}
            <a
              href="https://github.com/vidhatrashukla"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              https://github.com/vidhatrashukla
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}