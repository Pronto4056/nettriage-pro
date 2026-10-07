# Final manual preview checklist

Use synthetic examples only. Fresh October 7 checks now pass as recorded in browser-release-verification.md, except clear-history confirmation in an isolated profile: that remains Blocked because the browser API has no isolated-profile creation capability. This checklist remains available for manual regression review. Complete step 6's confirm/reload check in a genuinely private profile containing only disposable samples.

1. Open the local preview. At desktop width and 320–390px width, visit Dashboard, Network triage, History, Guides and Commands. Check readable text, focus outlines and no page-wide horizontal scrolling. The hop table may scroll inside its own region.
2. Use Tab/Shift+Tab and Enter to navigate. Submit invalid IPv4 with /24: the IPv4 field should receive focus and explain its error. No session should save.
3. Load each labeled ping/DNS/trace sample. Analyze combined evidence: facts should appear while broader health stays unverified. Failed ping must not mean offline; silent hops must not mean router failure.
4. Supply valid trace output with an invalid configuration field. Trace observations should remain visible, configuration checks should be skipped, and saving should remain blocked. Edit evidence: old findings should disappear.
5. Save a synthetic session; reload; reopen; confirm pasted text and findings. Delete only that test session and reload to confirm removal. Preserve existing personal sessions.
6. Test Clear history Cancel and Escape: records remain, focus returns to Clear history. Confirm clearing only in an empty/disposable browser profile with synthetic sessions. Tab should stay in the dialog.
7. Copy each of the 15 reference commands into a text editor and compare exactly. If clipboard access is denied, the app should explain manual copying instead of claiming success.
8. Open all command examples and guides. Confirm actual Windows observations and illustrative simulations remain separately labeled.

Record any failure with page, viewport, steps and observed result. Full cross-browser/screen-reader coverage has not been claimed.
