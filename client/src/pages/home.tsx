import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Player = 'X' | 'O';
type BoardState = (Player | null)[];
type GameStatus = 'playing' | 'won' | 'draw';

interface GameState {
  board: BoardState;
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  scores: {
    X: number;
    O: number;
    draws: number;
  };
}

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6] // diagonals
];

export default function Home() {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: 'X',
    status: 'playing',
    winner: null,
    scores: {
      X: 0,
      O: 0,
      draws: 0
    }
  });
  
  const [showWinModal, setShowWinModal] = useState(false);

  const checkWinner = (board: BoardState): Player | null => {
    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a] as Player;
      }
    }
    return null;
  };

  const checkDraw = (board: BoardState): boolean => {
    return board.every(cell => cell !== null) && !checkWinner(board);
  };

  const handleCellClick = (index: number) => {
    if (gameState.board[index] || gameState.status !== 'playing') {
      return;
    }

    const newBoard = [...gameState.board];
    newBoard[index] = gameState.currentPlayer;

    const winner = checkWinner(newBoard);
    const isDraw = checkDraw(newBoard);

    let newStatus: GameStatus = 'playing';
    let newScores = { ...gameState.scores };

    if (winner) {
      newStatus = 'won';
      newScores[winner]++;
      setShowWinModal(true);
    } else if (isDraw) {
      newStatus = 'draw';
      newScores.draws++;
      setShowWinModal(true);
    }

    setGameState({
      ...gameState,
      board: newBoard,
      currentPlayer: gameState.currentPlayer === 'X' ? 'O' : 'X',
      status: newStatus,
      winner,
      scores: newScores
    });
  };

  const resetGame = () => {
    setGameState({
      ...gameState,
      board: Array(9).fill(null),
      currentPlayer: 'X',
      status: 'playing',
      winner: null
    });
    setShowWinModal(false);
  };

  const closeWinModal = () => {
    setShowWinModal(false);
    resetGame();
  };

  const getGameStatusText = () => {
    if (gameState.status === 'won') {
      return `Player ${gameState.winner} wins!`;
    } else if (gameState.status === 'draw') {
      return "It's a draw!";
    } else {
      return (
        <>
          Player <span className="text-blue-500 font-bold">{gameState.currentPlayer}</span>'s turn
        </>
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="max-w-md w-full shadow-2xl border border-slate-200">
        <CardContent className="p-8">
          {/* Game Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Tic Tac Toe</h1>
            <div className="text-lg font-medium text-slate-600">
              {getGameStatusText()}
            </div>
          </div>

          {/* Game Board */}
          <div className="game-board mb-8">
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-100 rounded-xl">
              {gameState.board.map((cell, index) => (
                <button
                  key={index}
                  className="game-cell w-20 h-20 bg-white rounded-lg border-2 border-slate-300 hover:border-blue-400 transition-all duration-200 cell-hover flex items-center justify-center text-3xl font-bold shadow-sm disabled:cursor-not-allowed"
                  onClick={() => handleCellClick(index)}
                  disabled={gameState.status !== 'playing' || cell !== null}
                >
                  <span className={cell === 'X' ? 'text-blue-500' : 'text-red-500'}>
                    {cell}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Game Controls */}
          <div className="text-center space-y-4">
            <Button
              onClick={resetGame}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
            >
              New Game
            </Button>

            {/* Score Display */}
            <div className="flex justify-center space-x-8 text-sm font-medium">
              <div className="text-center">
                <div className="text-blue-500 font-bold text-lg">{gameState.scores.X}</div>
                <div className="text-slate-500">Player X</div>
              </div>
              <div className="text-center">
                <div className="text-slate-400 font-bold text-lg">{gameState.scores.draws}</div>
                <div className="text-slate-500">Draws</div>
              </div>
              <div className="text-center">
                <div className="text-red-500 font-bold text-lg">{gameState.scores.O}</div>
                <div className="text-slate-500">Player O</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Win Modal */}
      {showWinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl transform animate-bounce-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {gameState.status === 'won' ? `Player ${gameState.winner} Wins!` : "It's a Draw!"}
            </h2>
            <p className="text-slate-600 mb-6">
              {gameState.status === 'won' ? 'Congratulations on your victory!' : 'Great game, well played!'}
            </p>
            <Button
              onClick={closeWinModal}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
            >
              Play Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
