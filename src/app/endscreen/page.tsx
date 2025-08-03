"use client";

import Link from "next/link";
import { addScore, getScores } from "../actions";
import { useState } from "react";
import { useEffect } from "react";

export default function Page() {
    
    const [playerScore, setPlayerScore] = useState(0);
    const [scores, setScores] = useState(new Array<[string, number]>());
    useEffect(() => {
        const playerScoreFromStorage = parseInt(sessionStorage.getItem("score") || "0");
        setPlayerScore(playerScoreFromStorage);
        async function fetchScores() {
            const scoreAlreadySubmitted = sessionStorage.getItem("alreadySubmitted") === "true";
            const scoresMap = await getScores();
            const sortedScores = [...scoresMap.entries()].sort((a, b) => b[1] - a[1]);
            if(!scoreAlreadySubmitted) {
                const whereThePlayerScoreGoesBetween = sortedScores.findIndex(([name, score]) => playerScoreFromStorage >= score);
                if (whereThePlayerScoreGoesBetween === -1) {
                    sortedScores.push(["", playerScoreFromStorage]);
                } else {
                    sortedScores.splice(whereThePlayerScoreGoesBetween, 0, ["", playerScoreFromStorage]);
                }
            }
            setScores(sortedScores);
        }
        fetchScores();
    }, []);

    function updateScoresOnSubmit(event: React.FormEvent<HTMLFormElement>) {
        console.log("Updating scores on submit");
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        addScore(formData);
        setScores(scores.map(([name, score]) => name === "" ? [formData.get("name") as string, score] : [name, score]));
        sessionStorage.setItem("alreadySubmitted", "true");
    }
    
    return (
        <div className="max-w-md mx-auto my-8">
        <div className='p-4 mb-8'>
        <h1 className='text-2xl font-bold'>Your score</h1>
        <h2 className='text-9xl font-bold mb-4'>{playerScore}</h2>
        <Link href="/" className='bg-black text-white text-xl py-2 px-4 border hover:border-transparent rounded-md mr-2 cursor-pointer'>
        Play again
        </Link>
        </div>
        <div className="p-4">
        <h1 className='text-2xl font-bold mb-4'>Highscores</h1>
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left text-gray-700">
        <thead className="bg-white">
        <tr>
        <th className="px-4 py-2 font-medium">Name</th>
        <th className="px-4 py-2 font-medium">Score</th>
        </tr>
        </thead>    
        <tbody className="divide-y divide-gray-100">
        {scores.map(([name, score], index) => (
            <tr key={index} className="hover:bg-gray-50">
            {name === "" ? 
                <td>
                    <form action={addScore} className='flex flex-col items-center' onSubmit={updateScoresOnSubmit}>
                        <input type="hidden" name="score" value={playerScore} />
                        <div className="flex">
                            <input type="text" name="name" placeholder="Enter your name" className='border border-gray-300 rounded-l-md' required/>
                            <button className='bg-transparent hover:bg-black hover:text-white border hover:border-transparent rounded-r-md cursor-pointer' type="submit">
                                Submit Score
                            </button>
                        </div>
                    </form>
                </td> 
                : 
                <td className="px-4 py-2">{name}</td>
            }
            <td className="px-4 py-2">{score}</td>
            </tr>
        ))}
        </tbody>
        </table>
        
        
        
        
        
        </div>
        </div>
    )
}