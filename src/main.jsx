import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";  // <-- THIS IMPORT IS REQUIRED

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}
	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}
	componentDidCatch(error, info) {
		// eslint-disable-next-line no-console
		console.error("App crashed:", error, info);
	}
	render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: 16, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
					<div style={{ maxWidth: 800, margin: "24px auto", background: "#fff", color: "#000", border: "1px solid #e2e8f0", borderRadius: 16, padding: 16 }}>
						<h1 style={{ fontSize: 18, marginBottom: 8 }}>Something went wrong.</h1>
						<pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#334155" }}>{String(this.state.error)}</pre>
						<div style={{ marginTop: 12, display: "flex", gap: 8 }}>
							<button
								onClick={() => this.setState({ hasError: false, error: null })}
								style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}
							>Try Again</button>
							<button
								onClick={() => { try { localStorage.clear(); } catch {} window.location.reload(); }}
								style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #fcd34d", background: "#fff7ed" }}
							>Hard Reset</button>
						</div>
					</div>
				</div>
			);
		}
		return this.props.children;
	}
}

createRoot(document.getElementById("root")).render(
	<ErrorBoundary>
		<App />
	</ErrorBoundary>
);