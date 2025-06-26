import Link from "next/link";

export default function Page() {

return (
    <div className='px-20 py-8 w-dvw h-dvh text-center mt-[40dvh]'>
        <h1 className='text-4xl font-bold mb-8'>Memorize Street Names</h1>
        <Link href="/game" className='bg-transparent hover:bg-black hover:text-white text-xl py-2 px-4 border hover:border-transparent rounded-md mr-2 cursor-pointer'>
            Play the game
        </Link>
    </div>
  )
}