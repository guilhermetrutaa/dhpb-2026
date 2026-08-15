'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function DemoHeader() {
  return (
    <header className="w-full bg-white border-b border-black/10">
      <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
        <Link href="/" aria-label="Ir para a pagina inicial">
          <Image src="/logo.svg" width={96} height={96} alt="Logo DHPB" className="h-14 w-auto" />
        </Link>

        <Link
          href="/provas-antigas"
          className="border-2 border-[#82181A] text-[#82181A] font-semibold px-5 py-2 hover:bg-[#82181A] hover:text-white transition-colors text-sm md:text-base"
        >
          Voltar para provas antigas
        </Link>
      </div>
    </header>
  )
}
