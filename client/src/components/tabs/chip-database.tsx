import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertChipSchema, type Chip } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ChipDatabase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingChip, setEditingChip] = useState<Chip | null>(null);
  
  const { toast } = useToast();

  const { data: chips = [], isLoading } = useQuery({
    queryKey: ["/api/chips", searchQuery],
    enabled: true,
  });

  const form = useForm({
    resolver: zodResolver(insertChipSchema),
    defaultValues: {
      manufacturer: "",
      partNumber: "",
      capacity: "",
      packageType: "",
      interface: "",
      manufacturerId: "",
      deviceId: "",
      voltage: "",
      features: [],
      pinout: {},
      datasheet: "",
    },
  });

  const createChipMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/chips", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chips"] });
      toast({
        title: "Chip Added",
        description: "Successfully added new chip to database",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add chip to database",
        variant: "destructive",
      });
    },
  });

  const updateChipMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PUT", `/api/chips/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chips"] });
      toast({
        title: "Chip Updated",
        description: "Successfully updated chip information",
      });
      setEditingChip(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update chip information",
        variant: "destructive",
      });
    },
  });

  const deleteChipMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/chips/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chips"] });
      toast({
        title: "Chip Deleted",
        description: "Successfully deleted chip from database",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete chip from database",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: any) => {
    if (editingChip) {
      updateChipMutation.mutate({ id: editingChip.id, data });
    } else {
      createChipMutation.mutate(data);
    }
  };

  const handleEdit = (chip: Chip) => {
    setEditingChip(chip);
    form.reset({
      manufacturer: chip.manufacturer,
      partNumber: chip.partNumber,
      capacity: chip.capacity,
      packageType: chip.packageType,
      interface: chip.interface,
      manufacturerId: chip.manufacturerId || "",
      deviceId: chip.deviceId || "",
      voltage: chip.voltage || "",
      features: Array.isArray(chip.features) ? chip.features : [],
      pinout: chip.pinout || {},
      datasheet: chip.datasheet || "",
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this chip?")) {
      deleteChipMutation.mutate(id);
    }
  };

  const filteredChips = Array.isArray(chips) ? chips.filter((chip: Chip) =>
    chip.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chip.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chip.capacity.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const getInterfaceBadgeColor = (interfaceType: string) => {
    switch (interfaceType.toLowerCase()) {
      case "spi":
        return "bg-hw-primary";
      case "i2c":
        return "bg-hw-secondary";
      case "uart":
        return "bg-hw-success";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="h-full p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Chip Database</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Input
              placeholder="Search chips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-hw-code border-gray-600 text-white pl-10 pr-4 py-2 w-80"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          <Dialog open={isAddDialogOpen || !!editingChip} onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditingChip(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-hw-primary hover:bg-hw-primary/80"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Chip
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-hw-darker border-gray-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingChip ? "Edit Chip" : "Add New Chip"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="manufacturer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manufacturer</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-hw-code border-gray-600 text-white"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="partNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Part Number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-hw-code border-gray-600 text-white font-mono"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capacity</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-hw-code border-gray-600 text-white"
                              placeholder="e.g., 16MB"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="packageType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Package</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="bg-hw-code border-gray-600 text-white">
                                <SelectValue placeholder="Select package" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SOIC-8">SOIC-8</SelectItem>
                                <SelectItem value="WSON-8">WSON-8</SelectItem>
                                <SelectItem value="DIP-8">DIP-8</SelectItem>
                                <SelectItem value="BGA">BGA</SelectItem>
                                <SelectItem value="QFN">QFN</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="interface"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interface</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="bg-hw-code border-gray-600 text-white">
                                <SelectValue placeholder="Select interface" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SPI">SPI</SelectItem>
                                <SelectItem value="I2C">I2C</SelectItem>
                                <SelectItem value="UART">UART</SelectItem>
                                <SelectItem value="Parallel">Parallel</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="manufacturerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manufacturer ID</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-hw-code border-gray-600 text-white font-mono"
                              placeholder="e.g., EF"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deviceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Device ID</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-hw-code border-gray-600 text-white font-mono"
                              placeholder="e.g., 4018"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="voltage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voltage</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-hw-code border-gray-600 text-white"
                              placeholder="e.g., 2.7V - 3.6V"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="datasheet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Datasheet URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-hw-code border-gray-600 text-white"
                            placeholder="https://..."
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setEditingChip(null);
                        form.reset();
                      }}
                      className="border-gray-600"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createChipMutation.isPending || updateChipMutation.isPending}
                      className="bg-hw-primary hover:bg-hw-primary/80"
                    >
                      {editingChip ? "Update" : "Add"} Chip
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="flex-1 bg-hw-darker border-gray-700 overflow-hidden">
        <CardHeader>
          <div className="bg-hw-code border-b border-gray-700 p-3 -m-6 mb-0">
            <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-300">
              <div>Manufacturer</div>
              <div>Part Number</div>
              <div>Capacity</div>
              <div>Package</div>
              <div>Interface</div>
              <div>Actions</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-400">Loading chips...</div>
            </div>
          ) : filteredChips.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-400">
                {searchQuery ? "No chips found matching your search" : "No chips in database"}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {filteredChips.map((chip: Chip) => (
                <div
                  key={chip.id}
                  className="grid grid-cols-6 gap-4 p-3 text-sm hover:bg-gray-800 transition-colors"
                >
                  <div className="font-medium">{chip.manufacturer}</div>
                  <div className="font-mono">{chip.partNumber}</div>
                  <div>{chip.capacity}</div>
                  <div>{chip.packageType}</div>
                  <div>
                    <Badge className={`${getInterfaceBadgeColor(chip.interface)} text-white px-2 py-1 text-xs`}>
                      {chip.interface}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEdit(chip)}
                      variant="ghost"
                      size="sm"
                      className="text-hw-primary hover:text-hw-primary/80 p-1"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(chip.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-between items-center text-sm text-gray-400">
        <div>
          Showing {filteredChips.length} of {Array.isArray(chips) ? chips.length : 0} chips
        </div>
        <div className="text-xs">
          Use the search bar to filter chips by manufacturer, part number, or capacity
        </div>
      </div>
    </div>
  );
}
