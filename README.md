# 창팝 아카이브

창팝 영상을 재생하는 정적 웹사이트. 빌드 도구 없이 동작한다.

## 사용법
1. 영상(mp4/H.264 권장)을 `videos/` 에 넣는다. 하위 폴더는 태그로 쓰인다.
2. `python3 scripts/build.py` — `videos.json` 과 썸네일 생성 (ffmpeg 필요)
3. `node serve.js` 후 http://localhost:8000 접속

제목·아티스트·태그는 `meta.json` 으로 지정한다.
```json
{"영상1.mp4": {"title": "제목", "artist": "댄서", "tags": ["솔로"]}}
```

## 기능
검색·태그 필터·정렬, 재생 속도(0.25–2×), 반복, 좌우반전, A–B 구간반복, 프레임 단위 이동, 단축키.
