import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Package, Plus, Minus, Pencil, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Products() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [barcode, setBarcode] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [minStockLevel, setMinStockLevel] = useState("");
  const [stockAdjustment, setStockAdjustment] = useState("");

  const { data: products = [], refetch } = trpc.products.list.useQuery();

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Produkt opprettet!");
      setIsCreateOpen(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error("Kunne ikke opprette produkt: " + error.message);
    },
  });

  const adjustStockMutation = trpc.products.adjustStock.useMutation({
    onSuccess: () => {
      toast.success("Lagerbeholdning oppdatert!");
      setIsStockOpen(false);
      refetch();
      setStockAdjustment("");
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere lager: " + error.message);
    },
  });

  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Produkt oppdatert!");
      setIsEditOpen(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error("Kunne ikke oppdatere produkt: " + error.message);
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setPrice("");
    setCost("");
    setBarcode("");
    setStockQuantity("");
    setMinStockLevel("");
  };

  const handleCreate = () => {
    if (!name || !price) {
      toast.error("Vennligst fyll ut navn og pris");
      return;
    }

    createMutation.mutate({
      name,
      description: description || undefined,
      price,
      cost: cost || undefined,
      barcode: barcode || undefined,
      stockQuantity: stockQuantity ? parseInt(stockQuantity) : 0,
      minStockLevel: minStockLevel ? parseInt(minStockLevel) : undefined,
    });
  };

  const handleStockAdjustment = () => {
    if (!selectedProduct || !stockAdjustment) {
      toast.error("Vennligst angi antall");
      return;
    }

    adjustStockMutation.mutate({
      productId: selectedProduct,
      adjustment: parseInt(stockAdjustment),
    });
  };

  const openStockDialog = (productId: number) => {
    setSelectedProduct(productId);
    setIsStockOpen(true);
  };

  const openEditDialog = (product: any) => {
    setSelectedProduct(product.id);
    setName(product.name);
    setDescription(product.description || "");
    setPrice(product.retailPrice);
    setCost(product.costPrice || "");
    setBarcode(product.barcode || "");
    setStockQuantity(String(product.stockQuantity || 0));
    setMinStockLevel(String(product.reorderPoint || ""));
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedProduct || !name || !price) {
      toast.error("Vennligst fyll ut navn og pris");
      return;
    }

    updateMutation.mutate({
      productId: selectedProduct,
      name,
      description: description || undefined,
      price,
      cost: cost || undefined,
      barcode: barcode || undefined,
      stockQuantity: stockQuantity ? parseInt(stockQuantity) : undefined,
      minStockLevel: minStockLevel ? parseInt(minStockLevel) : undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Produkter</h1>
            <p className="text-muted-foreground">Administrer produkter og varelager</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Nytt produkt
          </Button>
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Ingen produkter ennå</p>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                Legg til produkter for å selge dem i kassen. Du kan administrere lager, priser og strekkoder.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Opprett første produkt
                </Button>
                <Button variant="outline" onClick={() => window.location.href = "/pos"}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Gå til kasse
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const isLowStock = product.reorderPoint && product.stockQuantity !== null && product.stockQuantity <= product.reorderPoint;
              
              return (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{product.name}</h3>
                          {product.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Pris:</span>
                        <span className="font-medium">{product.retailPrice} NOK</span>
                      </div>

                      {product.costPrice && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Kostpris:</span>
                          <span>{product.costPrice} NOK</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">På lager:</span>
                        <span className={`font-medium ${isLowStock ? "text-red-600" : ""}`}>
                          {product.stockQuantity} stk
                          {isLowStock && " ⚠️"}
                        </span>
                      </div>

                      {product.barcode && (
                        <div className="text-xs text-muted-foreground">
                          Strekkode: {product.barcode}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => openEditDialog(product)}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Rediger
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => openStockDialog(product.id)}
                        >
                          Juster lager
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        onClick={() => window.location.href = "/pos"}
                      >
                        <ShoppingCart className="h-3 w-3 mr-2" />
                        Gå til kasse
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Product Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nytt produkt</DialogTitle>
              <DialogDescription>
                Legg til et nytt produkt i lageret
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Produktnavn *</Label>
                <Input
                  id="name"
                  placeholder="F.eks. Sjampo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Beskrivelse</Label>
                <Input
                  id="description"
                  placeholder="Valgfri beskrivelse"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Salgspris (NOK) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="299.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Kostpris (NOK)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="barcode">Strekkode</Label>
                <Input
                  id="barcode"
                  placeholder="Valgfri strekkode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stockQuantity">Antall på lager</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    placeholder="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="minStockLevel">Min. lagernivå</Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    placeholder="5"
                    value={minStockLevel}
                    onChange={(e) => setMinStockLevel(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Oppretter..." : "Opprett produkt"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Product Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Rediger produkt</DialogTitle>
              <DialogDescription>
                Oppdater produktinformasjon
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Produktnavn *</Label>
                <Input
                  id="edit-name"
                  placeholder="F.eks. Sjampo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Beskrivelse</Label>
                <Input
                  id="edit-description"
                  placeholder="Valgfri beskrivelse"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-price">Salgspris (NOK) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    placeholder="299.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cost">Kostpris (NOK)</Label>
                  <Input
                    id="edit-cost"
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-barcode">Strekkode</Label>
                <Input
                  id="edit-barcode"
                  placeholder="Valgfri strekkode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-stockQuantity">Antall på lager</Label>
                  <Input
                    id="edit-stockQuantity"
                    type="number"
                    placeholder="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-minStockLevel">Min. lagernivå</Label>
                  <Input
                    id="edit-minStockLevel"
                    type="number"
                    placeholder="5"
                    value={minStockLevel}
                    onChange={(e) => setMinStockLevel(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Oppdaterer..." : "Lagre endringer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stock Adjustment Dialog */}
        <Dialog open={isStockOpen} onOpenChange={setIsStockOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Juster lagerbeholdning</DialogTitle>
              <DialogDescription>
                Legg til eller trekk fra antall produkter
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="adjustment">Antall (bruk - for å trekke fra)</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setStockAdjustment((prev) => String(parseInt(prev || "0") - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="adjustment"
                    type="number"
                    placeholder="0"
                    value={stockAdjustment}
                    onChange={(e) => setStockAdjustment(e.target.value)}
                    className="flex-1 text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setStockAdjustment((prev) => String(parseInt(prev || "0") + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Eksempel: +10 for å legge til, -5 for å trekke fra
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStockOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleStockAdjustment} disabled={adjustStockMutation.isPending}>
                {adjustStockMutation.isPending ? "Oppdaterer..." : "Oppdater lager"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
