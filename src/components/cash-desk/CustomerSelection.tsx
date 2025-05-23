
import React, { useState } from 'react';
import { Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Plus, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerSelectionProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  showNewCustomerForm: boolean;
  setShowNewCustomerForm: (show: boolean) => void;
  onCreateCustomer: (customer: Partial<Customer>) => void;
}

const CustomerSelection: React.FC<CustomerSelectionProps> = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  showNewCustomerForm,
  setShowNewCustomerForm,
  onCreateCustomer,
}) => {
  const [open, setOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const handleSubmitNewCustomer = () => {
    onCreateCustomer(newCustomer);
    setNewCustomer({ name: '', phone: '', email: '', address: '' });
  };

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    setOpen(false);
  };

  if (showNewCustomerForm) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Name *</Label>
            <Input
              id="customer-name"
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              placeholder="Customer name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-phone">Phone</Label>
            <Input
              id="customer-phone"
              value={newCustomer.phone || ''}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              placeholder="Phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-email">Email</Label>
            <Input
              id="customer-email"
              type="email"
              value={newCustomer.email || ''}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              placeholder="Email address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-address">Address</Label>
            <Input
              id="customer-address"
              value={newCustomer.address || ''}
              onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              placeholder="Address"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={() => setShowNewCustomerForm(false)}>Cancel</Button>
          <Button onClick={handleSubmitNewCustomer} disabled={!newCustomer.name}>Save Customer</Button>
        </CardFooter>
      </Card>
    );
  }

  if (selectedCustomer) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mr-3">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{selectedCustomer.name}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedCustomer.phone || selectedCustomer.email || 'No contact information'}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" size="sm" onClick={() => onSelectCustomer(null)} className="w-full">
            Change Customer
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCustomer ? selectedCustomer.name : "Select customer..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search customers..." />
            <CommandEmpty>No customer found.</CommandEmpty>
            <CommandList>
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.name}
                    onSelect={() => handleSelectCustomer(customer)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      {customer.phone && (
                        <div className="text-sm text-muted-foreground">{customer.phone}</div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setShowNewCustomerForm(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add New Customer
      </Button>
    </div>
  );
};

export default CustomerSelection;
