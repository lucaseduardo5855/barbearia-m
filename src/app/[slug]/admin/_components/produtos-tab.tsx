"use client"

import { formatBRL } from "@/lib/formatters"
import { MoneyInput } from "@/components/ui/money-input"
import { FieldHelp } from "@/components/ui/field-help"

import { useState } from "react"
import Image from "next/image"
import { Product } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { ShoppingBag, Plus, Trash2, Package, Pencil } from "lucide-react"
import {
  addProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/app/_actions/admin-actions"
import { AdminPageHeader } from "./admin-page-header"
import { PhotoUploadField } from "./photo-upload-field"

interface ProdutosTabProps {
  barbershopId: string
  products: Product[]
}

export default function ProdutosTab({
  barbershopId,
  products,
}: ProdutosTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [name, setName] = useState("")
  const [price, setPrice] = useState<number>(0)
  const [costPrice, setCostPrice] = useState<number>(0)
  const [stock, setStock] = useState<number>(10)
  const [minStock, setMinStock] = useState<number>(3)
  const [brand, setBrand] = useState("")
  const [category, setCategory] = useState("Pomadas & Finalizadores")
  const [imageUrl, setImageUrl] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setEditingProduct(null)
    setName("")
    setPrice(0)
    setCostPrice(0)
    setStock(10)
    setMinStock(3)
    setBrand("")
    setCategory("Pomadas & Finalizadores")
    setImageUrl("")
    setDescription("")
  }

  const openNewProduct = () => {
    resetForm()
    setIsAddOpen(true)
  }

  const openEditProduct = (product: Product) => {
    setEditingProduct(product)
    setName(product.name)
    setPrice(Number(product.price))
    setCostPrice(product.costPrice ? Number(product.costPrice) : 0)
    setStock(product.stock)
    setMinStock(product.minStock)
    setBrand(product.brand || "")
    setCategory(product.category || "Outros")
    setImageUrl(product.imageUrl || "")
    setDescription(product.description || "")
    setIsAddOpen(true)
  }

  const handleSaveProduct = async () => {
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
      const payload = {
        barbershopId,
        name: name.trim(),
        price,
        costPrice: costPrice > 0 ? costPrice : undefined,
        stock,
        minStock,
        brand: brand.trim() || undefined,
        category,
        imageUrl: imageUrl.trim() || undefined,
        description: description.trim() || undefined,
      }

      if (editingProduct) {
        await updateProductAction({ ...payload, productId: editingProduct.id })
      } else {
        await addProductAction(payload)
      }

      toast.success(
        editingProduct
          ? "Produto e estoque atualizados!"
          : "Produto cadastrado com sucesso!",
      )
      setIsAddOpen(false)
      resetForm()
    } catch (err: any) {
      toast.error(
        err.message || "Não foi possível adicionar o produto. Tente novamente.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProductAction({ barbershopId, productId })
      toast.success("Produto removido!")
    } catch (err: any) {
      toast.error(
        err.message || "Não foi possível excluir o produto. Tente novamente.",
      )
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={ShoppingBag}
        title="Produtos e estoque"
        description="Cadastre itens do balcão, acompanhe o estoque e mantenha a venda de produtos organizada."
        actions={
          <Button onClick={openNewProduct} className="gap-2 font-bold">
            <Plus className="size-4" /> Novo produto
          </Button>
        }
      />

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products && products.length > 0 ? (
          products.map((product) => {
            return (
              <Card
                key={product.id}
                className="min-h-52 rounded-2xl border border-border bg-card shadow-none transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-muted/40"
              >
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary text-primary">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <Package className="size-6" />
                        )}
                      </div>
                      <div>
                        <strong className="block text-sm font-semibold text-foreground">
                          {product.name}
                        </strong>
                        <span className="text-xs text-muted-foreground">
                          {product.brand || product.category || "Sem marca"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditProduct(product)}
                        className="size-11 text-muted-foreground hover:bg-primary/10 hover:text-primary md:size-9"
                        aria-label={`Editar produto ${product.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="size-11 text-muted-foreground hover:bg-destructive/10 hover:text-destructive md:size-9"
                        aria-label={`Excluir produto ${product.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {product.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs">
                    <div>
                      <span className="block text-[10px] text-muted-foreground">
                        Preço de Venda
                      </span>
                      <strong className="text-lg font-extrabold text-success">
                        {formatBRL(product.price)}
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="block text-[10px] text-muted-foreground">
                        Estoque
                      </span>
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          product.stock > product.minStock
                            ? "bg-success/15 text-success"
                            : "bg-warning/15 text-warning"
                        }`}
                      >
                        {product.stock} un
                      </span>
                      <span className="mt-1 block text-[11px] text-muted-foreground">
                        Alerta em {product.minStock} un
                        {product.stock <= product.minStock && (
                          <FieldHelp
                            text={
                              product.stock === 0
                                ? "Produto sem estoque. A venda fica bloqueada até repor as unidades."
                                : `Estoque baixo: restam ${product.stock} unidades. O alerta aparece quando o estoque fica igual ou abaixo de ${product.minStock}.`
                            }
                          />
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-3 rounded-xl border border-dashed border-border py-12 text-center">
            <ShoppingBag className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-50" />
            <p className="text-sm font-semibold text-muted-foreground">
              Nenhum produto cadastrado
            </p>
            <p className="text-xs text-muted-foreground">
              Cadastre produtos para vendê-los na agenda e comanda.
            </p>
          </div>
        )}
      </div>

      {/* Modal Novo Produto */}
      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="max-w-xl bg-card p-6 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-extrabold text-foreground">
              <Package className="size-5 text-primary" />{" "}
              {editingProduct ? "Editar produto" : "Cadastrar produto"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre produtos para vender diretamente nas comandas ou no
              balcão.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">
                Nome do Produto
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Pomada Efeito Matte 150g"
                className="bg-secondary/40"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label>Marca</label>
                <Input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Ex.: Don Alcides"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">
                  Preço de Venda (R$)
                </label>
                <MoneyInput
                  value={price}
                  onValueChange={setPrice}
                  placeholder="0,00"
                  className="bg-secondary/40 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label>Preço de custo (R$)</label>
                <MoneyInput
                  value={costPrice}
                  onValueChange={setCostPrice}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid items-end gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label>Estoque inicial</label>
                <Input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-1">
                  Alerta de estoque baixo{" "}
                  <FieldHelp text="O alerta aparece quando a quantidade disponível fica igual ou abaixo deste limite. Use 0 para alertar somente quando o produto acabar." />
                </label>
                <Input
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/40 p-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="Pomadas & Finalizadores">
                  Pomadas & Finalizadores
                </option>
                <option value="Óleos & Barba">Óleos & Barba</option>
                <option value="Tratamento Capilar">Tratamento Capilar</option>
                <option value="Bebidas">Bebidas & Snacks</option>
                <option value="Acessórios">Acessórios</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <PhotoUploadField
              label="Foto do produto"
              value={imageUrl}
              onChange={setImageUrl}
              alt={name || "Foto do produto"}
              disabled={isSubmitting}
            />

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">
                Descrição (opcional)
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes ou marca do produto"
                className="bg-secondary/40"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border/50 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAddOpen(false)
                resetForm()
              }}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveProduct}
              disabled={isSubmitting || !name.trim() || price <= 0}
              className="font-bold"
            >
              {isSubmitting
                ? "Salvando..."
                : editingProduct
                  ? "Salvar alterações"
                  : "Salvar produto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
