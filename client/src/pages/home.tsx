import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Bot, Users, RotateCcw, Smartphone, Zap, Brain, Sparkles } from "lucide-react";

type Player = 'X' | 'O';
type BoardState = (Player | null)[];
type GameStatus = 'playing' | 'won' | 'draw';
type GameMode = 'menu' | 'single' | 'multiplayer';
type Difficulty = 'easy' | 'medium' | 'hard';

interface GameState {
  board: BoardState;
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  winningCells: number[];
  scores: {
    X: number;
    O: number;
    draws: number;
  };
}

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const getEmptySquares = (board: BoardState): number[] => {
  return board.map((cell, index) => cell === null ? index : -1).filter(i => i !== -1);
};

const checkWinnerWithCells = (board: BoardState): { winner: Player | null; cells: number[] } => {
  for (const combination of WINNING_COMBINATIONS) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, cells: combination };
    }
  }
  return { winner: null, cells: [] };
};

const checkDraw = (board: BoardState): boolean => {
  return board.every(cell => cell !== null) && !checkWinnerWithCells(board).winner;
};

const minimax = (board: BoardState, depth: number, isMaximizing: boolean, alpha: number, beta: number): number => {
  const { winner } = checkWinnerWithCells(board);
  
  if (winner === 'O') return 10 - depth;
  if (winner === 'X') return depth - 10;
  if (checkDraw(board)) return 0;

  const emptySquares = getEmptySquares(board);
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const square of emptySquares) {
      const newBoard = [...board];
      newBoard[square] = 'O';
      const evaluation = minimax(newBoard, depth + 1, false, alpha, beta);
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const square of emptySquares) {
      const newBoard = [...board];
      newBoard[square] = 'X';
      const evaluation = minimax(newBoard, depth + 1, true, alpha, beta);
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

const getAIMove = (board: BoardState, difficulty: Difficulty): number => {
  const emptySquares = getEmptySquares(board);
  
  if (emptySquares.length === 0) return -1;

  if (difficulty === 'easy') {
    return emptySquares[Math.floor(Math.random() * emptySquares.length)];
  }

  if (difficulty === 'medium') {
    for (const square of emptySquares) {
      const testBoard = [...board];
      testBoard[square] = 'O';
      if (checkWinnerWithCells(testBoard).winner === 'O') {
        return square;
      }
    }
    
    for (const square of emptySquares) {
      const testBoard = [...board];
      testBoard[square] = 'X';
      if (checkWinnerWithCells(testBoard).winner === 'X') {
        return square;
      }
    }
    
    if (emptySquares.includes(4)) return 4;
    
    const corners = [0, 2, 6, 8].filter(c => emptySquares.includes(c));
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }
    
    return emptySquares[Math.floor(Math.random() * emptySquares.length)];
  }

  let bestMove = emptySquares[0];
  let bestValue = -Infinity;
  
  for (const square of emptySquares) {
    const newBoard = [...board];
    newBoard[square] = 'O';
    const moveValue = minimax(newBoard, 0, false, -Infinity, Infinity);
    if (moveValue > bestValue) {
      bestValue = moveValue;
      bestMove = square;
    }
  }
  
  return bestMove;
};

export default function Home() {
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: 'X',
    status: 'playing',
    winner: null,
    winningCells: [],
    scores: { X: 0, O: 0, draws: 0 }
  });
  const [showWinModal, setShowWinModal] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modalTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gameIdRef = useRef(0);

  const cancelPendingActions = useCallback(() => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    if (modalTimeoutRef.current) {
      clearTimeout(modalTimeoutRef.current);
      modalTimeoutRef.current = null;
    }
    setIsAIThinking(false);
  }, []);

  const makeAIMove = useCallback(() => {
    setIsAIThinking(true);
    const currentGameId = gameIdRef.current;
    
    aiTimeoutRef.current = setTimeout(() => {
      if (gameIdRef.current !== currentGameId) {
        setIsAIThinking(false);
        return;
      }

      setGameState(prevState => {
        if (prevState.status !== 'playing' || prevState.currentPlayer !== 'O') {
          return prevState;
        }

        const aiMove = getAIMove(prevState.board, difficulty);
        
        if (aiMove === -1) {
          return prevState;
        }

        const newBoard = [...prevState.board];
        newBoard[aiMove] = 'O';

        const { winner, cells } = checkWinnerWithCells(newBoard);
        const isDraw = checkDraw(newBoard);

        let newStatus: GameStatus = 'playing';
        let newScores = { ...prevState.scores };

        if (winner) {
          newStatus = 'won';
          newScores[winner]++;
        } else if (isDraw) {
          newStatus = 'draw';
          newScores.draws++;
        }

        if (newStatus !== 'playing') {
          modalTimeoutRef.current = setTimeout(() => {
            if (gameIdRef.current === currentGameId) {
              setShowWinModal(true);
            }
          }, 300);
        }

        return {
          ...prevState,
          board: newBoard,
          currentPlayer: 'X',
          status: newStatus,
          winner,
          winningCells: cells,
          scores: newScores
        };
      });
      setIsAIThinking(false);
      aiTimeoutRef.current = null;
    }, 400 + Math.random() * 300);
  }, [difficulty]);

  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (gameMode === 'single' && gameState.currentPlayer === 'O' && gameState.status === 'playing' && !isAIThinking) {
      makeAIMove();
    }
  }, [gameState.currentPlayer, gameState.status, gameMode, makeAIMove]);

  const handleCellClick = (index: number) => {
    if (gameState.board[index] || gameState.status !== 'playing' || isAIThinking) {
      return;
    }

    if (gameMode === 'single' && gameState.currentPlayer === 'O') {
      return;
    }

    const currentGameId = gameIdRef.current;
    const newBoard = [...gameState.board];
    newBoard[index] = gameState.currentPlayer;

    const { winner, cells } = checkWinnerWithCells(newBoard);
    const isDraw = checkDraw(newBoard);

    let newStatus: GameStatus = 'playing';
    let newScores = { ...gameState.scores };

    if (winner) {
      newStatus = 'won';
      newScores[winner]++;
    } else if (isDraw) {
      newStatus = 'draw';
      newScores.draws++;
    }

    if (newStatus !== 'playing') {
      modalTimeoutRef.current = setTimeout(() => {
        if (gameIdRef.current === currentGameId) {
          setShowWinModal(true);
        }
      }, 300);
    }

    setGameState({
      ...gameState,
      board: newBoard,
      currentPlayer: gameState.currentPlayer === 'X' ? 'O' : 'X',
      status: newStatus,
      winner,
      winningCells: cells,
      scores: newScores
    });
  };

  const resetGame = useCallback(() => {
    cancelPendingActions();
    gameIdRef.current++;
    setGameState(prev => ({
      ...prev,
      board: Array(9).fill(null),
      currentPlayer: 'X',
      status: 'playing',
      winner: null,
      winningCells: []
    }));
    setShowWinModal(false);
  }, [cancelPendingActions]);

  const resetScores = useCallback(() => {
    cancelPendingActions();
    gameIdRef.current++;
    setGameState({
      board: Array(9).fill(null),
      currentPlayer: 'X',
      status: 'playing',
      winner: null,
      winningCells: [],
      scores: { X: 0, O: 0, draws: 0 }
    });
    setShowWinModal(false);
  }, [cancelPendingActions]);

  const goToMenu = useCallback(() => {
    cancelPendingActions();
    gameIdRef.current++;
    setGameMode('menu');
    setGameState({
      board: Array(9).fill(null),
      currentPlayer: 'X',
      status: 'playing',
      winner: null,
      winningCells: [],
      scores: { X: 0, O: 0, draws: 0 }
    });
    setShowWinModal(false);
  }, [cancelPendingActions]);

  const startGame = useCallback((mode: 'single' | 'multiplayer', diff?: Difficulty) => {
    cancelPendingActions();
    gameIdRef.current++;
    if (diff) setDifficulty(diff);
    setGameMode(mode);
    setGameState({
      board: Array(9).fill(null),
      currentPlayer: 'X',
      status: 'playing',
      winner: null,
      winningCells: [],
      scores: { X: 0, O: 0, draws: 0 }
    });
    setShowWinModal(false);
  }, [cancelPendingActions]);

  const closeWinModal = () => {
    setShowWinModal(false);
    resetGame();
  };

  const getDifficultyIcon = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return <Zap className="w-5 h-5" />;
      case 'medium': return <Brain className="w-5 h-5" />;
      case 'hard': return <Sparkles className="w-5 h-5" />;
    }
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 'from-green-500 to-emerald-600';
      case 'medium': return 'from-amber-500 to-orange-600';
      case 'hard': return 'from-red-500 to-rose-600';
    }
  };

  const getGameStatusText = () => {
    if (gameState.status === 'won') {
      if (gameMode === 'single') {
        return gameState.winner === 'X' ? 'You Win!' : 'AI Wins!';
      }
      return `Player ${gameState.winner} wins!`;
    } else if (gameState.status === 'draw') {
      return "It's a Draw!";
    } else if (isAIThinking) {
      return (
        <span className="flex items-center justify-center gap-2">
          <span className="ai-thinking-dots">AI is thinking</span>
        </span>
      );
    } else {
      const playerLabel = gameMode === 'single' 
        ? (gameState.currentPlayer === 'X' ? 'Your' : "AI's")
        : `Player ${gameState.currentPlayer}'s`;
      return (
        <>
          <span className={gameState.currentPlayer === 'X' ? 'text-blue-500' : 'text-rose-500'}>
            {playerLabel}
          </span> turn
        </>
      );
    }
  };

  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 game-background">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8 animate-fade-in">
            <div className="game-logo mb-4">
              <span className="text-blue-500">X</span>
              <span className="text-slate-400 mx-1">|</span>
              <span className="text-rose-500">O</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Tic Tac Toe</h1>
            <p className="text-slate-400 text-sm">Choose your game mode</p>
          </div>

          <Card className="game-card border-0 shadow-2xl animate-slide-up" data-testid="mode-selection-card">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <h2 className="text-white font-semibold flex items-center gap-2 text-lg">
                  <Bot className="w-5 h-5 text-blue-400" />
                  Single Player
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                    <Button
                      key={diff}
                      onClick={() => startGame('single', diff)}
                      className={`mobile-button bg-gradient-to-r ${getDifficultyColor(diff)} hover:opacity-90 text-white font-medium flex flex-col items-center gap-1 py-4`}
                      data-testid={`button-difficulty-${diff}`}
                    >
                      {getDifficultyIcon(diff)}
                      <span className="capitalize text-xs">{diff}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <Button
                  onClick={() => startGame('multiplayer')}
                  className="w-full mobile-button bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold flex items-center justify-center gap-3"
                  data-testid="button-multiplayer"
                >
                  <Users className="w-5 h-5" />
                  <span>Local Multiplayer</span>
                  <Smartphone className="w-4 h-4 opacity-60" />
                </Button>
                <p className="text-slate-500 text-xs text-center mt-2">Play with a friend on the same device</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col game-background">
      <div className="game-header p-4 flex items-center justify-between">
        <Button
          onClick={goToMenu}
          variant="ghost"
          className="text-slate-400 hover:text-white hover:bg-slate-800 p-2"
          data-testid="button-back-menu"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          {gameMode === 'single' ? (
            <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getDifficultyColor(difficulty)} text-white flex items-center gap-1`}>
              {getDifficultyIcon(difficulty)}
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white flex items-center gap-1">
              <Users className="w-3 h-3" />
              Multiplayer
            </span>
          )}
        </div>

        <Button
          onClick={resetScores}
          variant="ghost"
          className="text-slate-400 hover:text-white hover:bg-slate-800 p-2"
          data-testid="button-reset-scores"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-xl font-semibold text-white" data-testid="text-game-status">
              {getGameStatusText()}
            </div>
          </div>

          <div className="game-board-container mb-6">
            <div className="game-grid">
              {gameState.board.map((cell, index) => (
                <button
                  key={index}
                  className={`game-cell ${cell ? 'filled' : ''} ${gameState.winningCells.includes(index) ? 'winning' : ''} ${isAIThinking ? 'disabled' : ''}`}
                  onClick={() => handleCellClick(index)}
                  disabled={gameState.status !== 'playing' || cell !== null || isAIThinking}
                  data-testid={`cell-${index}`}
                >
                  {cell && (
                    <span className={`cell-content ${cell === 'X' ? 'x-mark' : 'o-mark'}`}>
                      {cell}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="score-board mb-6">
            <div className="score-item">
              <div className="score-value text-blue-400" data-testid="score-x">{gameState.scores.X}</div>
              <div className="score-label">{gameMode === 'single' ? 'You (X)' : 'Player X'}</div>
            </div>
            <div className="score-item">
              <div className="score-value text-slate-400" data-testid="score-draws">{gameState.scores.draws}</div>
              <div className="score-label">Draws</div>
            </div>
            <div className="score-item">
              <div className="score-value text-rose-400" data-testid="score-o">{gameState.scores.O}</div>
              <div className="score-label">{gameMode === 'single' ? 'AI (O)' : 'Player O'}</div>
            </div>
          </div>

          <Button
            onClick={resetGame}
            className="w-full mobile-button bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold"
            data-testid="button-new-game"
          >
            New Game
          </Button>
        </div>
      </div>

      {showWinModal && (
        <div className="modal-overlay" data-testid="modal-win">
          <div className="modal-content animate-bounce-in">
            <div className="modal-icon">
              {gameState.status === 'won' ? (
                gameMode === 'single' && gameState.winner === 'O' ? '🤖' : '🎉'
              ) : '🤝'}
            </div>
            <h2 className="modal-title" data-testid="text-win-message">
              {gameState.status === 'won' 
                ? (gameMode === 'single' 
                    ? (gameState.winner === 'X' ? 'You Win!' : 'AI Wins!') 
                    : `Player ${gameState.winner} Wins!`)
                : "It's a Draw!"
              }
            </h2>
            <p className="modal-subtitle">
              {gameState.status === 'won' 
                ? (gameMode === 'single' && gameState.winner === 'O' 
                    ? 'Better luck next time!' 
                    : 'Congratulations!')
                : 'Great game, well played!'
              }
            </p>
            <div className="flex gap-3 w-full">
              <Button
                onClick={goToMenu}
                variant="outline"
                className="flex-1 mobile-button border-slate-600 text-slate-300 hover:bg-slate-700"
                data-testid="button-modal-menu"
              >
                Menu
              </Button>
              <Button
                onClick={closeWinModal}
                className="flex-1 mobile-button bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold"
                data-testid="button-play-again"
              >
                Play Again
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
