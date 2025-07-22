import { LobbyController } from "#domains/lobby/controller/lobbyController.js";
import { LobbyService } from "#domains/lobby/service/lobbyService.js";
import { TournamentService } from "#domains/lobby/service/tournamentService.js";
import { TournamentRepository } from "#domains/lobby/repo/tournamentRepo.js";
import { LobbyRepository } from "#domains/lobby/repo/lobbyRepo.js";

export default async function lobbyRoutes(fastify, _opts) {
  const lobbyRepository = new LobbyRepository();
  const tournamentRepository = new TournamentRepository();

  const lobbyService = new LobbyService(lobbyRepository);
  const tournamentService = new TournamentService(tournamentRepository);

  const controller = new LobbyController(lobbyService, tournamentService);

  fastify.get("/", controller.getAll); // 로비 전체 조회
  fastify.get("/:id", controller.getById); // 단일 로비 조회
  fastify.get("/:id/matches", controller.getMatches); // 로비 매칭 조회

  fastify.post("/", controller.create); // 로비 생성

  // 소켓 처리
  fastify.post("/:id/join", controller.join); // 유저 로비 입장
  fastify.post("/:id/left", controller.left); // 유저 로비 퇴장
  fastify.post("/:id/authorize", controller.authorize); // 방장 위임
  fastify.post("/:id/ready_state", controller.ready_state); // 레디 상태
  fastify.post("/:id/create_match", controller.create_match); // 매칭 생성
  fastify.post("/:id/start_game", controller.start_game); // 게임 시작

  // fastify.post("/:id/finish", controller.lobby_finish);     // 로비 종료 (우승자 나왔을 때)
}
