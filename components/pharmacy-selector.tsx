"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePharmacies } from "@/lib/use-pharmacies"
import { cn } from "@/lib/utils"

export function PharmacySelector() {
  const { pharmacies, activePharmacy, setActivePharmacy, addPharmacy } = usePharmacies()
  const [open, setOpen] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newPharmacy, setNewPharmacy] = useState({
    name: "",
    address: "",
    phone: "",
  })

  const handleAddPharmacy = () => {
    if (newPharmacy.name && newPharmacy.address) {
      const id = `pharmacy-${Date.now().toString(36)}`
      const pharmacy = {
        id,
        name: newPharmacy.name,
        address: newPharmacy.address,
        phone: newPharmacy.phone || "",
      }

      addPharmacy(pharmacy)
      setActivePharmacy(pharmacy)
      setNewPharmacy({ name: "", address: "", phone: "" })
      setShowAddDialog(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full sm:w-[250px] justify-between"
          >
            {activePharmacy ? activePharmacy.name : "Select pharmacy..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full sm:w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Search pharmacy..." />
            <CommandList>
              <CommandEmpty>No pharmacy found.</CommandEmpty>
              <CommandGroup>
                {pharmacies.map((pharmacy) => (
                  <CommandItem
                    key={pharmacy.id}
                    value={pharmacy.id}
                    onSelect={() => {
                      setActivePharmacy(pharmacy)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", activePharmacy?.id === pharmacy.id ? "opacity-100" : "opacity-0")}
                    />
                    {pharmacy.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    setShowAddDialog(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Pharmacy
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Pharmacy</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newPharmacy.name}
                onChange={(e) => setNewPharmacy({ ...newPharmacy, name: e.target.value })}
                className="col-span-3"
                placeholder="Pharmacy name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <Input
                id="address"
                value={newPharmacy.address}
                onChange={(e) => setNewPharmacy({ ...newPharmacy, address: e.target.value })}
                className="col-span-3"
                placeholder="Physical address"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={newPharmacy.phone}
                onChange={(e) => setNewPharmacy({ ...newPharmacy, phone: e.target.value })}
                className="col-span-3"
                placeholder="Contact number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPharmacy} className="bg-emerald-600 hover:bg-emerald-700">
              Add Pharmacy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
