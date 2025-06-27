import Link from "next/link";

export default function Page() {

return (
    <div className='px-20 py-8 w-dvw text-center mt-[40dvh]'>
        <h1 className='text-4xl font-bold mb-8'>Memorize Street Names</h1>
        <Link href="/game/pointToStreet" className='bg-transparent hover:bg-black hover:text-white text-xl py-2 px-4 border hover:border-transparent rounded-md mr-2 cursor-pointer'>
            New game (point to street)
        </Link>
        <Link href="/game/nameTheStreet" className='bg-transparent hover:bg-black hover:text-white text-xl py-2 px-4 border hover:border-transparent rounded-md mr-2 cursor-pointer'>
            New game (name the street)
        </Link>
        <Link href="/game/free" className='bg-transparent hover:bg-black hover:text-white text-xl py-2 px-4 border hover:border-transparent rounded-md mr-2 cursor-pointer'>
            Free practice
        </Link>
    </div>
  )
}