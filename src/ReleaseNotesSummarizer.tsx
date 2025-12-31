import React, { useState } from 'react';
import { Copy, Sparkles, Loader2 } from 'lucide-react';

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

  const handleInputChange = (e) => {
    const { name, value } = e;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (timeString) => {
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

Generate a release message following this exact format and style:

1. Start with emoji header containing version and date/time info
2. Add a clear Subject line based on the nature of changes
3. Begin with "Dear all,"
4. Write a brief intro explaining what this release includes
5. Organize changes into clear numbered sections with bold headers
6. Use simple, non-technical language focused on business impact
7. End with the closing statement provided above
8. Keep it concise and professional

Style guidelines:
- Use emojis sparingly (calendar, clock, phone icons in header)
- Bold important headers and key terms
- Number main points (1., 2., 3.)
- Use sub-bullets (-) for details under main points where needed
- Focus on WHAT changed and WHY it matters, not HOW it works
- Group related changes together
- Use clear section headers like "Key Fixes:", "New Features:", "Improvements:", etc.
- Keep sentences clear and concise

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

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || "API request failed");
      }

      const message = data.choices?.[0]?.message?.content || "No response generated";
      setGeneratedMessage(message);
    } catch (error) {
      setGeneratedMessage("Error generating release notes. Please try again.");
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
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Release Information</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Backend Version
                  </label>
                  <input
                    type="text"
                    name="osBE"
                    value={formData.osBE}
                    onChange={(e) => handleInputChange(e.target)}
                    placeholder="e.g., 4.3.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Web App Version
                  </label>
                  <input
                    type="text"
                    name="osFE"
                    value={formData.osFE}
                    onChange={(e) => handleInputChange(e.target)}
                    placeholder="e.g., 12.3.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile App Version
                  </label>
                  <input
                    type="text"
                    name="proFE"
                    value={formData.proFE}
                    onChange={(e) => handleInputChange(e.target)}
                    placeholder="e.g., 3.0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Native Build Version
                  </label>
                  <input
                    type="text"
                    name="proNative"
                    value={formData.proNative}
                    onChange={(e) => handleInputChange(e.target)}
                    placeholder="e.g., 10.2.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Release Date *
                  </label>
                  <input
                    type="date"
                    name="releaseDate"
                    value={formData.releaseDate}
                    onChange={(e) => handleInputChange(e.target)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                </label>
                <textarea
                  name="ticketDetails"
                  value={formData.ticketDetails}
                  onChange={(e) => handleInputChange(e.target)}
                  placeholder="Paste ticket headers and descriptions here. Include details about what changed and why it matters."
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <button
                onClick={generateReleaseNotes}
                disabled={!canGenerate || isGenerating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
                  {generatedMessage}
                </pre>
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