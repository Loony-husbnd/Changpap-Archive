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

## 영상을 외부 저장소(R2 등)에 둘 때
`config.json` 의 `mediaBase` 에 영상 폴더의 공개 주소를 적고 `build.py` 를 다시 실행한다.
`videos/` 안의 상대 경로가 그대로 주소 뒤에 붙는다. 저장소에는 `videos.json` 과 `thumbs/` 만 올린다.
영상 저장소에는 CORS 설정이 필요 없다(`<video>` 재생만 한다).
