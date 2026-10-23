# 우리집 생각 에이스

에이스 시리즈의 생각(사고력) 과목. 아이가 이름 지은 **생각나무**에 물을 주며 규칙 찾기, 도형·공간, 퍼즐, 추리, 몇 가지?, 스무고개 문제를 풉니다.

- 주소: https://eternal-today.github.io/thinking-ace/
- 별: 5문제 맞힐 때마다 별 1개 (한 판 정답률 40% 미만이면 0). 나무의 물도 같은 수.
- 별·찬스·명예의 전당은 에이스 홈과 함께 쓰는 공통 지갑(`src/ace`, 다섯 저장소에 같은 파일).
- 설계 문서: 에이스 시리즈 프로젝트의 `thinking-ace/docs/`

## 개발

```
npm install
npm run dev     # http://localhost:3004
npm test        # 문제 만들기 검사 (유형·단계마다 300문제)
npm run lint    # 타입 검사
npm run build
```

main에 push하면 GitHub Pages로 배포됩니다 (`.github/workflows/deploy.yml`).
