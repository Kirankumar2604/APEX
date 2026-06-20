/**
 * Crypto Debug Panel
 * Development tool for testing and debugging cryptographic operations
 */

'use client'

import { useState } from 'react'
import { runAllTests, runTest } from '@/lib/crypto.test'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration?: number
}

export default function CryptoDebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [selectedTest, setSelectedTest] = useState<string>('all')

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  const handleRunTests = async () => {
    setIsRunning(true)
    setResults([])

    try {
      if (selectedTest === 'all') {
        const testResults = await runAllTests()
        setResults(testResults)
      } else {
        const testResult = await runTest(selectedTest)
        if (testResult) {
          setResults([testResult])
        }
      }
    } catch (error) {
      console.error('Test execution error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const handleTestFullFlow = async () => {
    setIsRunning(true)
    setResults([])

    try {
      const testResult = await runTest('full-flow')
      if (testResult) {
        setResults([testResult])
      }
    } catch (error) {
      console.error('Full flow test error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const totalTime = results.reduce((sum, r) => sum + (r.duration || 0), 0)

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-transform hover:scale-110"
        title="Crypto Debug Panel"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 max-h-[600px] bg-slate-900 border border-purple-500/30 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-purple-500/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Crypto Debug Panel</h3>
                  <p className="text-xs text-slate-400">Development Mode</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="p-4 border-b border-slate-700 space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Select Test</label>
              <select
                value={selectedTest}
                onChange={(e) => setSelectedTest(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:border-purple-500"
                disabled={isRunning}
              >
                <option value="all">All Tests</option>
                <option value="keypair">Keypair Generation</option>
                <option value="export-import">Key Export/Import</option>
                <option value="signature">Signature Verification</option>
                <option value="consent">Consent Signing</option>
                <option value="aes">AES Encryption</option>
                <option value="pbkdf2">PBKDF2 Key Derivation</option>
                <option value="hybrid">Hybrid Encryption</option>
                <option value="hash">SHA-256 Hashing</option>
                <option value="keystore">Keystore Operations</option>
                <option value="utility">Utility Functions</option>
                <option value="full-flow">Full Consent Flow</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRunTests}
                disabled={isRunning}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Run Tests</span>
                  </>
                )}
              </button>

              <button
                onClick={handleTestFullFlow}
                disabled={isRunning}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Test Full Consent Flow"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Results Summary */}
          {results.length > 0 && (
            <div className="p-4 border-b border-slate-700 bg-slate-800/50">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-slate-400">Passed</p>
                  <p className="text-lg font-bold text-emerald-400">{passed}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Failed</p>
                  <p className="text-lg font-bold text-red-400">{failed}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Time</p>
                  <p className="text-lg font-bold text-blue-400">{totalTime}ms</p>
                </div>
              </div>
              <div className="mt-2">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                    style={{ width: `${(passed / results.length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-center text-slate-400 mt-1">
                  {((passed / results.length) * 100).toFixed(1)}% Success Rate
                </p>
              </div>
            </div>
          )}

          {/* Test Results */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {results.length === 0 && !isRunning && (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-slate-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm text-slate-400">No tests run yet</p>
                <p className="text-xs text-slate-500 mt-1">Select a test and click Run</p>
              </div>
            )}

            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.passed
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {result.passed ? (
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium ${
                        result.passed ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {result.name}
                      </p>
                      {result.duration && (
                        <span className="text-xs text-slate-400 font-mono">
                          {result.duration}ms
                        </span>
                      )}
                    </div>
                    {result.error && (
                      <p className="text-xs text-red-300 mt-1 break-words">
                        {result.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-700 p-3 bg-slate-800/50">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Web Crypto API</span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Active
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Made with Bob
