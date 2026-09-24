// Decryptor per immagini cifrate XOR - Geiko Dojo
// Le immagini originali sono cifrate e salvate come .enc per nasconderle su GitHub
// Questo script le decifra client-side al caricamento della pagina
(function() {
    // Chiave XOR 32 byte - offuscata in 4 blocchi
    const _a = [146, 186, 196, 132, 245, 136, 183, 197];
    const _b = [57, 79, 17, 1, 93, 66, 207, 82];
    const _c = [146, 247, 151, 27, 111, 193, 1, 131];
    const _d = [130, 150, 216, 47, 83, 128, 64, 24];
    const KEY = new Uint8Array([..._a, ..._b, ..._c, ..._d]);

    function mimeFromEncUrl(encUrl) {
        const original = encUrl.replace(/\.enc$/i, '');
        const ext = original.split('.').pop().toLowerCase();
        const map = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp'
        };
        return map[ext] || 'application/octet-stream';
    }

    async function decryptImage(img) {
        const encUrl = img.getAttribute('data-enc');
        if (!encUrl) return;
        try {
            const res = await fetch(encodeURI(encUrl));
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const buf = await res.arrayBuffer();
            const bytes = new Uint8Array(buf);
            for (let i = 0; i < bytes.length; i++) {
                bytes[i] ^= KEY[i % KEY.length];
            }
            const mime = mimeFromEncUrl(encUrl);
            const blob = new Blob([bytes], { type: mime });
            const url = URL.createObjectURL(blob);
            img.src = url;
            img.removeAttribute('data-enc');
            // Opzionale: revoca URL quando la pagina viene scaricata
            // img.addEventListener('load', () => setTimeout(()=>URL.revokeObjectURL(url), 60000), {once:true});
        } catch (e) {
            console.error('[decrypt] failed for', encUrl, e);
            // Fallback: prova a mostrare placeholder
            img.alt = 'Immagine non disponibile';
        }
    }

    function init() {
        const imgs = document.querySelectorAll('img[data-enc]');
        if (imgs.length === 0) return;
        imgs.forEach(img => decryptImage(img));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Supporta immagini aggiunte dinamicamente
    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const n of m.addedNodes) {
                if (n.nodeType === 1) {
                    if (n.matches && n.matches('img[data-enc]')) decryptImage(n);
                    const nested = n.querySelectorAll ? n.querySelectorAll('img[data-enc]') : [];
                    nested.forEach(decryptImage);
                }
            }
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();
