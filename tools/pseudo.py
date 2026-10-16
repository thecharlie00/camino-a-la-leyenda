#!/usr/bin/env python3
"""Versiona nombres reales al estilo de los Pro Evolution Soccer antiguos: se parecen, pero no son iguales.
   Determinista (mismo nombre → mismo resultado). Uso: python3 tools/pseudo.py "Nombre Apellido" …"""
import hashlib, re, sys, unicodedata

BAD = ["puta", "puto", "culo", "polla", "coño", "mierda", "pene", "caca", "fuck", "shit", "cunt", "dick", "cock", "piss", "nazi",
       "hitler", "merde", "cazzo", "merda", "fick", "arsch", "kacke", "nigg", "negr", "fag", "rape", "porn", "sex", "anus", "teta",
       "pedo", "pis ", "kkk", "ss "]
PARTICLES = {"de", "da", "do", "dos", "das", "del", "la", "le", "van", "von", "der", "den", "ter", "ten", "di", "du", "el", "al", "bin", "ben", "e", "y"}
VOW = "aeiouáéíóúàèìòùâêîôûäëïöüãõy"


def h(s):
    return int(hashlib.md5(s.encode("utf-8")).hexdigest(), 16)


def strip(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower()


def keepcase(new, old):
    if old[:1].isupper() and new[:1].islower():
        return new[:1].upper() + new[1:]
    return new


def cands(tok, first_fixed):
    """Variantes de una palabra con su peso (más peso = más «PES»)."""
    t, out = tok, []

    def sub(pat, rep, w, flags=0):
        n = re.sub(pat, rep, t, count=1, flags=flags)
        if n != t:
            out.append((n, w))
    V = "aeiouáéíóúàèìòùâêîôûäëïöüãõAEIOUÁÉÍÓÚ"
    # terminaciones típicas
    sub(r"ez$", "es", 5); sub(r"(?<=[aeiou])s$", "z", 3)
    sub(r"ić$", "ich", 6); sub(r"ic$", "ich", 5)
    sub(r"son$", "sen", 5); sub(r"sen$", "son", 5); sub(r"ov$", "off", 5); sub(r"ev$", "eff", 5); sub(r"ski$", "sky", 5); sub(r"sky$", "ski", 5)
    sub(r"ini$", "inni", 4); sub(r"elli$", "eli", 4); sub(r"etti$", "eti", 4); sub(r"inho$", "inio", 5); sub(r"inha$", "inia", 5); sub(r"ão$", "aum", 4)
    sub(r"ier$", "ié", 3); sub(r"eau$", "ó", 3); sub(r"oux$", "u", 3); sub(r"(?<=[a-z])ey$", "ei", 4); sub(r"(?<=[a-z])y$", "i", 4)
    sub(r"(?<=[a-z])i$", "y", 4); sub(r"mann$", "man", 5); sub(r"(?<=[a-z])man$", "mann", 4); sub(r"stein$", "stain", 3); sub(r"berg$", "berk", 3)
    sub(r"ij", "y", 7); sub(r"(?<=[a-z])y(?=[bcdfghjklmnpqrstvwxz])", "i", 6)
    # consonantes dobles y vocales dobles
    m = re.search(r"([bcdfgklmnprstz])\1", t)
    if m:
        out.append((t[:m.start()] + t[m.start()] + t[m.end():], 7))
    m = re.search(r"([aeou])\1", t)
    if m:
        out.append((t[:m.start()] + t[m.start()] + t[m.end():], 7))
    # grupos que suenan igual
    sub(r"ph", "f", 6); sub(r"(?<=.)th", "t", 5); sub(r"ck", "k", 6); sub(r"(?<=.)qu(?=[ei])", "k", 4); sub(r"(?<=.)x", "ks", 3)
    sub(r"(?<=.)c(?=[aou])", "k", 4); sub(r"(?<=.)k(?=[aou])", "c", 4); sub(r"(?<=.)z", "s", 4); sub(r"(?<=[" + V + "n])s(?=[" + V + "])", "z", 4)
    sub(r"(?<=.)v", "b", 3); sub(r"(?<=.)b(?=[aeiou])", "v", 2)
    sub(r"(?<=.)w", "v", 4); sub(r"(?<=.)y(?=[aeiou])", "i", 3); sub(r"(?<=[aeiou])j(?=[aeiou])", "ll", 1); sub(r"(?<=.)ll", "y", 1)
    sub(r"(?<=.)ch", "sh", 2); sub(r"(?<=.)sh", "ch", 2); sub(r"(?<=[aeiou])g(?=[ei])", "j", 2); sub(r"(?<=.)ñ", "ny", 3)
    # inicial (solo apellidos)
    if not first_fixed:
        sub(r"^C(?=[aou])", "K", 3); sub(r"^K(?=[aou])", "C", 3); sub(r"^W", "V", 3); sub(r"^V", "B", 2); sub(r"^Y(?=[aeiou])", "I", 2)
        sub(r"^Ph", "F", 4); sub(r"^Qu", "Cu", 3)
    # doblar una consonante entre vocales
    m = re.search(r"(?<=[" + V + "])([bcdfglmnprst])(?=[" + V + "])", t)
    if m:
        out.append((t[:m.start()] + m.group(1) * 2 + t[m.end():], 2))
    # palabras muy cortas: doblar la última consonante
    if len(t) <= 4 and t[-1:].lower() in "bdgklmnprst":
        out.append((t + t[-1].lower(), 3))
    seen, res = set(), []
    for c, w in out:
        c = keepcase(c, tok)
        if c != tok and strip(c) != strip(tok) and c not in seen and not any(b in strip(" " + c + " ") for b in BAD):
            seen.add(c); res.append((c, w))
    return res


def vary(tok, seed, first_fixed=False):
    if len(tok) < 2 or not re.search(r"[A-Za-zÀ-ÿ]", tok):
        return tok
    c = cands(tok, first_fixed)
    if not c:
        return tok
    tot = sum(w for _, w in c)
    r = h(seed + tok) % tot
    for v, w in c:
        if r < w:
            return v
        r -= w
    return c[0][0]


def main_token(parts):
    """La palabra «fuerte» de un apellido compuesto (no partículas)."""
    idx = [i for i, p in enumerate(parts) if p.lower() not in PARTICLES and len(p) > 1]
    if not idx:
        return len(parts) - 1
    return max(idx, key=lambda i: (len(re.sub(r"[^A-Za-zÀ-ÿ]", "", parts[i])), i))


def versionar(fn, ln, salt=""):
    """Devuelve (nombre, apellido) versionados. El apellido siempre cambia; el nombre, a veces y sin tocar la inicial."""
    fn, ln = (fn or "").strip(), (ln or "").strip()
    seed = salt + "|" + fn + "|" + ln
    if ln:
        parts = re.split(r"(\s+|-)", ln)
        words = [p for p in parts if p.strip() and p != "-"]
        mi = main_token(words)
        target = words[mi]
        new = vary(target, seed)
        if new == target and len(words) > 1:
            for j, w2 in enumerate(words):
                n2 = vary(w2, seed)
                if n2 != w2:
                    target, new = w2, n2
                    break
        out, done = [], False
        for p in parts:
            if not done and p == target:
                out.append(new); done = True
            else:
                out.append(p)
        ln2 = "".join(out)
        if ln2 == ln:
            m = re.search(r"(?<=[a-z])([bcdfglmnprst])(?=[a-záéíóú])", ln)
            ln2 = ln[:m.start()] + m.group(1) * 2 + ln[m.end():] if m else (ln + ln[-1] if ln[-1].isalpha() else ln + "o")
    else:
        ln2 = ln
    fn2 = fn
    if fn and h("fn" + seed) % 100 < 20:
        ws = fn.split(" ")
        ws[0] = vary(ws[0], seed, first_fixed=True)
        fn2 = " ".join(ws)
    return fn2, ln2


if __name__ == "__main__":
    names = sys.argv[1:] or ["Kylian Mbappé", "Lamine Yamal", "Jude Bellingham", "Erling Haaland", "Vinícius Júnior", "|Pedri", "|Gavi", "Robert Lewandowski",
                             "Florian Wirtz", "Mohamed Salah", "Virgil van Dijk", "Kevin De Bruyne", "Harry Kane", "Bukayo Saka", "Declan Rice", "Federico Valverde",
                             "Thibaut Courtois", "Dani Carvajal", "Luka Modrić", "Son Heung-min", "Lautaro Martínez", "Nicolò Barella", "Antoine Griezmann",
                             "Hansi Flick", "Xabi Alonso", "Mikel Arteta", "Carlo Ancelotti", "Diego Simeone", "Pep Guardiola", "Lionel Messi", "Cristiano Ronaldo",
                             "|Rodri", "Alexander Isak", "Achraf Hakimi", "Kim Min-jae", "Jamal Musiala", "Joshua Kimmich", "Ousmane Dembélé", "Raphinha|", "|Casemiro"]
    for n in names:
        if "|" in n:
            fn, ln = n.split("|")
            if not ln:
                fn, ln = "", fn
        else:
            fn, ln = n.split(" ", 1)
        a, b = versionar(fn, ln)
        print(f"{(fn + ' ' + ln).strip():28} → {(a + ' ' + b).strip()}")
