"use client";

import Link from "next/link";
import { useScoreStore } from "../scoreStore";

export default function Page() {
    
    const score = useScoreStore((state) => state.score);
    return (
        <div className='px-20 py-8 w-dvw text-center mt-[20dvh]'>
        <h1 className='text-2xl font-bold mb-8'>Score</h1>
        <h2 className='text-9xl font-bold mb-8'>{score}</h2>
        <Link href="/" className='bg-transparent hover:bg-black hover:text-white text-xl py-2 px-4 border hover:border-transparent rounded-md mr-2 cursor-pointer'>
            Play again
        </Link> 
        {/* <br/><br/>
            <input type="text" placeholder="Enter your name" className='border border-gray-300 rounded-md px-4 py-2 mb-4' />
            <button className='bg-black text-white text-xl py-2 px-4 rounded-md hover:bg-gray-800'>
            Submit Score
            </button>
            <p className='mt-4'>Your score will be saved and displayed in the highscores.</p>
            <h3 className='text-2xl font-bold mb-4'>Highscores</h3>
            <ul className='list-disc list-inside text-left'>
            <li>Player 1: 100</li>
            <li>Player 2: 90</li>
            <li>Player 3: 80</li>
            <li>Player 4: 70</li>
            <li>Player 5: 60</li> 
            </ul> */}
            </div>
        )
    }