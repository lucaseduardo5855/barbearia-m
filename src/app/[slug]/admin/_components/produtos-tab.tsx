"use client"

import { useState } from "react"
import Image from "next/image"
import { Product } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import { ShoppingBag, Plus, Trash2, Package } from "lucide-react"
import { addProductAction, deleteProductAction } from "@/app/_actions/admin-actions"
import { AdminPageHeader } from "./admin-page-header"
import { PhotoUploadField } from "./photo-upload-field"

interface ProdutosTabProps {
  barbershopId: string
  products: Product[]
}

export default function ProdutosTab({ barbershopId, products }: ProdutosTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [name, setName] = useState("")
  const [price, setPrice] = useState<number>(0)
  const [costPrice, setCostPrice] = useState<number>(0)
  const [stock, setStock] = useState<number>(10)
  const [category, setCategory] = useState("Pomadas & Finalizadores")
  const [imageUrl, setImageUrl] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddProduct = async () => {
    try {
      if (!name.trim()) {
        toast.error("Informe o nome do produto.")
        return
      }
      if (price <= 0) {
        toast.error("Informe o preço de venda.")
        return
      }

      setIsSubmitting(true)
      await addProductAction({
        barbershopId,
        name: name.trim(),
        price,
        costPrice: costPrice > 0 ? costPrice : undefined,
        stock,
        category,
        imageUrl: imageUrl.trim() || undefined,
        description: description.trim() || undefined
      })

      toast.success("Produto cadastrado com sucesso!")
      setIsAddOpen(false)
      setName("")
      setPrice(0)
      setCostPrice(0)
      setStock(10)
      setImageUrl("")
      setDescription("")
    } catch (err: any) {
      toast.error(err.message || "Não foi possível adicionar o produto. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProductAction({ barbershopId, productId })
      toast.success("Produto removido!")
    } catch (err: any) {
      toast.error(err.message || "Não foi possível excluir o produto. Tente novamente.")
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={ShoppingBag}
        title="Produtos e estoque"
        description="Cadastre itens do balcão, acompanhe o estoque e mantenha a venda de produtos organizada."
        actions={
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 font-bold">
            <Plus className="size-4" /> Novo produto
          </Button>
        }
      />

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products && products.length > 0 ? (
          products.map((product) => {
            return (
              <Card key={product.id} className="min-h-52 rounded-2xl border border-border bg-card shadow-none transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-muted/40">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary text-primary">
                        {product.imageUrl ? (
                          <Image src={product.imageUrl} alt={product.name} fill sizes="48px" className="object-cover" />
                        ) : (
                          <Package className="size-6" />
                        )}
                      </div>
                      <div>
                        <strong className="text-sm font-bold text-foreground block">{product.name}</strong>
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{product.category || "Geral"}</span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="size-11 md:size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      aria-label={`Excluir produto ${product.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Preço de Venda</span>
                      <strong className="text-lg font-extrabold text-success">
                        R$ {Number(product.price).toFixed(2).replace(".", ",")}
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block">Estoque</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                        product.stock > 5 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                      }`}>
                        {product.stock} un
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-3 text-center py-12 border border-dashed border-border rounded-xl">
            <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-muted-foreground">Nenhum produto cadastrado</p>
            <p className="text-xs text-muted-foreground">Cadastre produtos para vendê-los na agenda e comanda.</p>
          </div>
        )}
      </div>

      {/* Modal Novo Produto */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-xl bg-card p-6 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-extrabold text-foreground">
              <Package className="size-5 text-primary" /> Cadastrar produto
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre produtos para vender diretamente nas comandas ou no balcão.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Nome do Produto</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Pomada Efeito Matte 150g"
                className="bg-secondary/40"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Preço de Venda (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price || ""}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="0,00"
                  className="bg-secondary/40 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Estoque Inicial</label>
                <Input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="bg-secondary/40 font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/40 p-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="Pomadas & Finalizadores">Pomadas & Finalizadores</option>
                <option value="Óleos & Barba">Óleos & Barba</option>
                <option value="Tratamento Capilar">Tratamento Capilar</option>
                <option value="Bebidas">Bebidas & Snacks</option>
                <option value="Acessórios">Acessórios</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <PhotoUploadField label="Foto do produto" value={imageUrl} onChange={setImageUrl} alt={name || "Foto do produto"} disabled={isSubmitting} />

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Descrição (opcional)</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes ou marca do produto"
                className="bg-secondary/40"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button variant="ghost" size="sm" onClick={() => setIsAddOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button
              onClick={handleAddProduct}
              disabled={isSubmitting || !name.trim() || price <= 0}
              className="font-bold"
            >
              {isSubmitting ? "Salvando..." : "Salvar Produto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
