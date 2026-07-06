#!/usr/bin/env python3
"""Download author portrait images to public/avatars/"""
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data" / "default-data.json"
OUT = ROOT / "public" / "avatars"

URLS = {
    "franz-kafka": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Kafka1906_cropped.jpg/320px-Kafka1906_cropped.jpg",
    "anton-pavlovich-chekhov": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Anton_Chekhov_1889.jpg/320px-Anton_Chekhov_1889.jpg",
    "lev-nikolayevich-tolstoy": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/L.N.Tolstoy_Prokudin-Gorsky.jpg/320px-L.N.Tolstoy_Prokudin-Gorsky.jpg",
    "oscar-wilde": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Oscar_Wilde_Sarony.jpg/320px-Oscar_Wilde_Sarony.jpg",
    "bertrand-russell": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Bertrand_Russell_1938.jpg/320px-Bertrand_Russell_1938.jpg",
    "albert-camus": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Albert_Camus%2C_gagnant_de_prix_Nobel%2C_portrait_en_buste%2C_pos%C3%A9_au_bureau%2C_faisant_face_%C3%A0_gauche%2C_cigarette_%C3%A0_la_main.jpg/320px-Albert_Camus%2C_gagnant_de_prix_Nobel%2C_portrait_en_buste%2C_pos%C3%A9_au_bureau%2C_faisant_face_%C3%A0_gauche%2C_cigarette_%C3%A0_la_main.jpg",
    "william-somerset-maugham": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Somerset_Maugham_1934.jpg/320px-Somerset_Maugham_1934.jpg",
    "raymond-carver": "https://upload.wikimedia.org/wikipedia/en/thumb/5/5a/Raymond_Carver.jpg/320px-Raymond_Carver.jpg",
    "shu-qingchun": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Lao_She.jpg/320px-Lao_She.jpg",
    "ottessa-moshfegh": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ottessa_Moshfegh_2016.jpg/320px-Ottessa_Moshfegh_2016.jpg",
    "abraham-yehoshua": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Avraham_B._Yehoshua.jpg/320px-Avraham_B._Yehoshua.jpg",
    "mu-xin": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Mu_Xin_2010.jpg/320px-Mu_Xin_2010.jpg",
    "emil-michel-cioran": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Emil_Cioran.jpg/320px-Emil_Cioran.jpg",
    "charles-bukowski": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Charles_Bukowski_by_Jesse_Simon_%28cropped%29.jpg/320px-Charles_Bukowski_by_Jesse_Simon_%28cropped%29.jpg",
    "daniil-kharms": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Daniil_Kharms.jpg/320px-Daniil_Kharms.jpg",
    "françoise-sagan": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Francoise_Sagan_1985.jpg/320px-Francoise_Sagan_1985.jpg",
    "ira-ishida": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Ira_Ishida_2019.jpg/320px-Ira_Ishida_2019.jpg",
    "zhu-shenghao": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Zhu_Shenghao.jpg/320px-Zhu_Shenghao.jpg",
    "ji-xianlin": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Ji_Xianlin.jpg/320px-Ji_Xianlin.jpg",
    "hu-shi": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Hu_Shi_in_1910.jpg/320px-Hu_Shi_in_1910.jpg",
    "marcel-proust": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Marcel_Proust_1900.jpg/320px-Marcel_Proust_1900.jpg",
    "fyodor-dostoevsky": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Vasily_Perov_-_Portrait_of_Fyodor_Dostoyevsky_-_Google_Art_Project.jpg/320px-Vasily_Perov_-_Portrait_of_Fyodor_Dostoyevsky_-_Google_Art_Project.jpg",
    "wang-zengqi": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Wang_Zengqi.jpg/320px-Wang_Zengqi.jpg",
    "fumi-yamamoto": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Fumi_Yamamoto_2013.jpg/320px-Fumi_Yamamoto_2013.jpg",
    "alexander-pushkin": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Kiprensky_Pushkin.jpg/320px-Kiprensky_Pushkin.jpg",
    "orhan-pamuk": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Orhan_Pamuk_2009.jpg/320px-Orhan_Pamuk_2009.jpg",
    "yu-hua": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Yu_Hua_2018.jpg/320px-Yu_Hua_2018.jpg",
    "한강": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Han_Kang_2024_%28cropped%29.jpg/320px-Han_Kang_2024_%28cropped%29.jpg",
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    data = json.loads(DATA.read_text(encoding="utf-8"))
    manifest = {}

    for author in data["authors"]:
        aid = author["id"]
        url = URLS.get(aid)
        if not url:
            print(f"skip {aid}")
            continue
        ext = ".jpg"
        dest = OUT / f"{re.sub(r'[^a-zA-Z0-9_-]', '_', aid)}{ext}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "XiaoHenShu/1.0"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                dest.write_bytes(resp.read())
            manifest[aid] = f"/avatars/{dest.name}"
            print(f"ok {aid}")
        except Exception as e:
            print(f"fail {aid}: {e}")

    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"saved {len(manifest)} avatars")


if __name__ == "__main__":
    main()
