import React, { useState, useEffect } from 'react';
import { Database, Search, PlusCircle, Sparkles, Layers, CheckCircle2, Shield, RefreshCw } from 'lucide-react';

export default function VectorStudio({ API_BASE_URL }) {
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('System Documentation');
  const [docText, setDocText] = useState('');
  const [addStatus, setAddStatus] = useState(null);
  const [indexing, setIndexing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('What architecture does Loki use?');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const [vectorStats, setVectorStats] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/vector/stats`);
      if (res.ok) {
        const data = await res.json();
        setVectorStats(data);
      }
    } catch (e) {
      console.error("Vector stats error:", e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!docTitle.trim() || !docText.trim() || indexing) return;
    setIndexing(true);
    setAddStatus(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/vector/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle,
          category: docCategory,
          text: docText
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAddStatus({ success: true, text: `Successfully indexed ${data.chunks_created} vector chunk(s) into ChromaDB!` });
        setDocTitle('');
        setDocText('');
        fetchStats();
      } else {
        setAddStatus({ success: false, text: 'Failed to index document.' });
      }
    } catch (err) {
      setAddStatus({ success: false, text: err.message });
    } finally {
      setIndexing(false);
    }
  };

  const handleSearchVectorDB = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || searching) return;
    setSearching(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/vector/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          top_k: 3
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner Stats */}
      <div className="glass-panel emerald-glow-box" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Database size={32} color="#10b981" className="pulse-glow" />
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>ChromaDB Vector Store & RAG Engine</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Embeds text into 384-dimensional dense vectors for semantic nearest-neighbor retrieval.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', padding: '10px 16px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Indexed Vector Chunks</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
              {vectorStats?.total_vector_chunks || 0}
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', padding: '10px 16px', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Embedding Dimensions</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
              {vectorStats?.vector_dimension || 384}-d
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column: Index Document Form */}
        <div className="glass-panel emerald-glow-box" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
            <PlusCircle size={22} color="#10b981" />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Add Knowledge Document to Vector DB</h3>
          </div>

          <form onSubmit={handleAddDocument} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Document Title</label>
              <input
                type="text"
                className="chat-input"
                placeholder="e.g. Loki System Specifications"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Category Tag</label>
              <input
                type="text"
                className="chat-input"
                placeholder="e.g. Architecture, Manual, HR Policy"
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Text Content to Embed</label>
              <textarea
                className="chat-input"
                rows={6}
                style={{ width: '100%', resize: 'vertical' }}
                placeholder="Paste knowledge text or documentation here..."
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={indexing}
              className="send-btn"
              style={{ padding: '12px', justifyContent: 'center', fontSize: '14px' }}
            >
              <Sparkles size={16} />
              <span>{indexing ? 'Generating Embeddings & Indexing...' : 'Generate Embeddings & Index in Vector DB'}</span>
            </button>

            {addStatus && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                background: addStatus.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: addStatus.success ? '#34d399' : '#f87171',
                border: `1px solid ${addStatus.success ? '#10b981' : '#ef4444'}`
              }}>
                {addStatus.text}
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Semantic Vector Search Playground */}
        <div className="glass-panel gold-glow-box" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
            <Search size={22} color="#f59e0b" />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Semantic Vector Search Playground</h3>
          </div>

          <form onSubmit={handleSearchVectorDB} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="chat-input"
              style={{ flex: 1 }}
              placeholder="Ask a question or enter search query..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="send-btn" disabled={searching} style={{ padding: '0 18px' }}>
              <Search size={16} />
              <span>Search</span>
            </button>
          </form>

          {/* Search Results Display */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {searchResults ? (
              searchResults.matches.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                  No similar vector matches found.
                </div>
              ) : (
                searchResults.matches.map((match, idx) => (
                  <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: '#fbbf24' }}>
                        📌 {match.metadata?.title || 'Document Chunk'}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#34d399',
                        fontWeight: 600
                      }}>
                        Similarity: {(match.similarity_score * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#e6edf3', lineHeight: '1.5', background: '#080c14', padding: '10px', borderRadius: '6px' }}>
                      {match.text}
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      Category: {match.metadata?.category || 'General'} • Chunk #{match.metadata?.chunk_index ?? 0}
                    </div>
                  </div>
                ))
              )
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: '13px' }}>
                Enter a query above to calculate cosine distance across vector embeddings in real-time.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
