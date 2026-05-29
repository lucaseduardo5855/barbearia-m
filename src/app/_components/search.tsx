"use client"

// Component de busca para a página inicial

import { SearchIcon } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Form, FormField, FormItem, FormControl, FormMessage } from "./ui/form"
import { useRouter } from "next/navigation"

import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

// Esquema de validação para os parâmetros de busca
const forSchema = z.object({
  search: z.string().trim().min(1, {
    message: "O campo de busca não pode estar vazio.",
  }),
})

type SearchProps = {
  initialValue?: string
}

const Search = ({ initialValue = "" }: SearchProps) => {
  const form = useForm<z.infer<typeof forSchema>>({
    resolver: zodResolver(forSchema),
    defaultValues: {
      search: initialValue,
    },
  })

  const router = useRouter()

  const onSubmit = (data: z.infer<typeof forSchema>) => {
    const q = encodeURIComponent(data.search)
    router.push(`/barbershops?search=${q}`)
  }

  return (
    // O formulário de busca é simples, com um campo de input e um botão de submit. Ele utiliza o react-hook-form para gerenciamento do estado do formulário e validação, e o zod para definir o esquema de validação.
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
        <FormField
          control={form.control}
          name="search"
          render={({ field, fieldState }: any) => (
            <FormItem className="w-full">
              <FormControl>
                <Input
                  className="w-full rounded-full bg-muted/60 px-4 py-2 text-sm placeholder:text-muted-foreground"
                  placeholder="Faça sua busca..."
                  {...field}
                />
              </FormControl>
              {fieldState?.error && (
                <FormMessage className="ml-2 mt-1 text-sm text-red-500">
                  {String(fieldState.error.message)}
                </FormMessage>
              )}
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="icon"
          className="rounded-full bg-violet-600 p-2 text-white hover:bg-violet-700"
        >
          <SearchIcon />
        </Button>
      </form>
    </Form>
  )
}

export default Search
