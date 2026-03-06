import React, { useState } from 'react';
import { TrendingUp, Search, AlertCircle, Sparkles, Info, Zap } from 'lucide-react';

const StockAnalyzer = () => {
  const [symbols, setSymbols] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const analyzeStocks = async () => {
    setLoading(true);
    setError('');
    setResults([]);
    
    const symbolList = symbols.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
    
    if (symbolList.length === 0) {
      setError('Please enter at least one stock symbol');
      setLoading(false);
      return;
    }
    
    const analysisResults = [];
    
    for (let i = 0; i < symbolList.length; i++) {
      const symbol = symbolList[i];
      setProgress(`Analyzing ${symbol} (${i + 1}/${symbolList.length})... This may take 10-20 seconds per stock.`);
      
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 3000,
            messages: [{
              role: "user",
              content: `Search the web for current financial data on ${symbol} stock. I need REAL, CURRENT data to analyze this stock for investment potential.

First, verify this is a real, publicly traded stock. If it doesn't exist or you can't find reliable data, say so.

If it exists, gather the following ACTUAL metrics:
1. Company name
2. Revenue growth rate (YoY %)
3. Operating margin (%)
4. Market position & competitive advantages
5. Management quality & track record
6. PEG ratio or P/E ratio
7. Recent news and developments

Score each metric based on the actual data you find. Return ONLY valid JSON with no markdown:

{
  "symbol": "${symbol}",
  "exists": true or false,
  "companyName": "Full Company Name",
  "metrics": {
    "revenueGrowth": {"score": 0-20, "value": "X% YoY", "status": "good/moderate/poor", "detail": "brief explanation"},
    "operatingLeverage": {"score": 0-20, "value": "X% margin", "status": "good/moderate/poor", "detail": "brief explanation"},
    "marketPosition": {"score": 0-20, "value": "brief description", "status": "good/moderate/poor", "detail": "brief explanation"},
    "management": {"score": 0-20, "value": "brief description", "status": "good/moderate/poor", "detail": "brief explanation"},
    "valuation": {"score": 0-20, "value": "PEG X.X or P/E XX", "status": "good/moderate/poor", "detail": "brief explanation"}
  },
  "news": {
    "newsImpact": "positive/neutral/negative",
    "bonusFactor": -10 to 10,
    "summary": "2-3 sentences on recent developments"
  }
}`
            }],
            tools: [{ "type": "web_search_20250305", "name": "web_search" }]
          })
        });

        const data = await response.json();
        
        let responseText = data.content
          .filter(item => item.type === "text")
          .map(item => item.text)
          .join("\n");
        
        responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          responseText = jsonMatch[0];
        }
        
        const analysis = JSON.parse(responseText);
        
        if (!analysis.exists) {
          analysisResults.push({
            symbol: symbol,
            companyName: 'Stock Not Found',
            error: true,
            errorMessage: `${symbol} does not appear to be a valid publicly traded stock symbol. Please verify the symbol is correct.`
          });
          continue;
        }
        
        const baseScore = Object.values(analysis.metrics).reduce((sum, metric) => sum + metric.score, 0);
        const finalScore = Math.min(100, Math.max(0, baseScore + analysis.news.bonusFactor));
        
        analysisResults.push({
          ...analysis,
          totalScore: baseScore,
          finalScore: finalScore
        });
        
      } catch (err) {
        console.error(`Error analyzing ${symbol}:`, err);
        analysisResults.push({
          symbol: symbol,
          companyName: 'Analysis Failed',
          error: true,
          errorMessage: `Unable to retrieve data for ${symbol}. This may be due to an invalid symbol or data availability issues.`
        });
      }
    }
    
    setResults(analysisResults.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0)));
    setLoading(false);
    setProgress('');
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'from-green-500 to-emerald-600';
    if (score >= 50) return 'from-yellow-500 to-amber-600';
    return 'from-red-500 to-rose-600';
  };

  const getStatusColor = (status) => {
    if (status === 'good') return 'bg-green-100 text-green-800 border-green-300';
    if (status === 'moderate') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Strong Buy';
    if (score >= 70) return 'Buy';
    if (score >= 60) return 'Moderate Buy';
    if (score >= 50) return 'Hold';
    if (score >= 40) return 'Moderate Sell';
    return 'Sell';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-block mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white px-12 py-6 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <Zap className="w-12 h-12" />
                  <div className="text-left">
                    <h1 className="text-5xl font-black tracking-tight">ASSET</h1>
                    <p className="text-blue-100 text-sm font-medium mt-1 tracking-wide">Automated Stock Scoring & Evaluation Tool</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Real-time analysis of investment potential using live market data
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-indigo-100">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={symbols}
              onChange={(e) => setSymbols(e.target.value)}
              placeholder="Enter stock symbols (e.g., AAPL, MSFT, GOOGL)"
              className="flex-1 px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
              onKeyPress={(e) => e.key === 'Enter' && !loading && analyzeStocks()}
              disabled={loading}
            />
            <button
              onClick={analyzeStocks}
              disabled={loading || !symbols.trim()}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Analyze
                </>
              )}
            </button>
          </div>
          
          <div className="flex items-start gap-2 text-gray-600 text-sm mb-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-500" />
            <p><strong>Real-time data:</strong> Analyzes 5 key metrics from live market sources (10-20 seconds per stock)</p>
          </div>
          
          {loading && progress && (
            <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-indigo-700 font-medium">{progress}</p>
              <p className="text-indigo-600 text-sm mt-1">Please wait while we gather real market data...</p>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-6">
            {results.map((stock, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-100 hover:border-indigo-200 hover:shadow-2xl transition-all"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {stock.symbol}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{stock.companyName}</h3>
                        {!stock.error && <p className="text-gray-500 font-medium">Rank #{idx + 1}</p>}
                      </div>
                    </div>
                    {!stock.error && (
                      <div className="text-right">
                        <div className={`text-5xl font-black bg-gradient-to-r ${getScoreColor(stock.finalScore)} bg-clip-text text-transparent`}>
                          {stock.finalScore}
                        </div>
                        <div className="text-gray-700 font-bold mt-1">{getScoreLabel(stock.finalScore)}</div>
                      </div>
                    )}
                  </div>

                  {stock.error ? (
                    <div className="flex items-center gap-3 text-red-400 bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-red-700 font-medium">{stock.errorMessage}</span>
                    </div>
                  ) : (
                    <>
                      {stock.metrics && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          {Object.entries(stock.metrics).map(([key, metric]) => (
                            <div key={key} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200 hover:border-indigo-300 transition-all">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600 text-sm font-bold capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className={`px-2 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(metric.status)}`}>
                                  {metric.status.toUpperCase()}
                                </span>
                              </div>
                              <div className="text-gray-900 font-bold text-lg mb-1">{metric.value}</div>
                              <div className="text-gray-600 text-xs mb-3 leading-relaxed">{metric.detail}</div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-300 rounded-full h-2.5">
                                  <div
                                    className={`h-2.5 rounded-full bg-gradient-to-r ${getScoreColor(metric.score * 5)} transition-all shadow-sm`}
                                    style={{ width: `${(metric.score / 20) * 100}%` }}
                                  />
                                </div>
                                <span className="text-gray-700 text-sm font-bold">{metric.score}/20</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {stock.news && (
                        <div className={`rounded-xl p-5 border-2 ${
                          stock.news.newsImpact === 'positive' 
                            ? 'bg-green-50 border-green-200' 
                            : stock.news.newsImpact === 'negative' 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-yellow-50 border-yellow-200'
                        }`}>
                          <div className="flex items-start gap-3">
                            <Sparkles className={`w-5 h-5 mt-1 ${
                              stock.news.newsImpact === 'positive' 
                                ? 'text-green-600' 
                                : stock.news.newsImpact === 'negative' 
                                ? 'text-red-600' 
                                : 'text-yellow-600'
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-gray-900 font-bold">Recent News Impact</span>
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                  stock.news.bonusFactor > 0 
                                    ? 'bg-green-200 text-green-800' 
                                    : stock.news.bonusFactor < 0 
                                    ? 'bg-red-200 text-red-800' 
                                    : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {stock.news.bonusFactor > 0 ? '+' : ''}{stock.news.bonusFactor} pts
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm leading-relaxed font-medium">{stock.news.summary}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-gray-200 shadow-lg">
            <TrendingUp className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2 font-semibold">Enter stock symbols above to begin real-time analysis</p>
            <p className="text-gray-500 text-sm">Uses live market data - each stock takes 10-20 seconds to analyze</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAnalyzer;
