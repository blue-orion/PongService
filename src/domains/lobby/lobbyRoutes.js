import { LobbyController } from "#domains/lobby/controller/lobbyController.js";
// import { TournamentController } from "#domains/lobby/controller/tournamentController.js";

export default async function lobbyRoutes(fastify, _opts) {
  const controller = new LobbyController();
  // const tournamentController = new TournamentController();

  // 로비 전체 조회
  fastify.get("/", controller.getAll.bind(controller));

  // 단일 로비 조회
  fastify.get("/:id", controller.getById.bind(controller));

  // 로비 생성
  fastify.post("/", controller.create.bind(controller));

  // 유저 로비 입장
  fastify.post("/:id/join", controller.join.bind(controller));

  // 유저 로비 퇴장
  fastify.post("/:id/left", controller.left.bind(controller));

  // 방장 위임
  fastify.post("/:id/authorize", controller.authorize.bind(controller));

  // 레디 상태
  fastify.post("/:id/ready_state", controller.ready_state.bind(controller));

  // 매칭 생성
  fastify.post("/:id/create_match", controller.create_match.bind(controller));

  // 로비 종료 (우승자 나왔을 때)
  // fastify.post("/:id/finish", controller.lobby_finish.bind(controller));  

}