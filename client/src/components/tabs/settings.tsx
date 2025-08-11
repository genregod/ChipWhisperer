import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Eye, EyeOff, FolderOpen, Save, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsFormData {
  // Hardware settings
  defaultSpiClock: string;
  autoDetectChip: boolean;
  verifyAfterWrite: boolean;
  enableFlowControl: boolean;
  connectionTimeout: number;
  
  // API settings
  openaiApiKey: string;
  aiModel: string;
  maxTokens: number;
  
  // Database settings
  databaseUrl: string;
  autoSaveHistory: boolean;
  cacheChipData: boolean;
  
  // Integration settings
  arduinoPath: string;
  vscodePath: string;
  librepCBPath: string;
}

export default function Settings() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();

  const form = useForm<SettingsFormData>({
    defaultValues: {
      defaultSpiClock: "500",
      autoDetectChip: true,
      verifyAfterWrite: false,
      enableFlowControl: true,
      connectionTimeout: 5000,
      openaiApiKey: "",
      aiModel: "gpt-4o",
      maxTokens: 1000,
      databaseUrl: "",
      autoSaveHistory: true,
      cacheChipData: true,
      arduinoPath: "",
      vscodePath: "",
      librepCBPath: "",
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    // Save settings to localStorage or send to backend
    localStorage.setItem('hardwareDebuggerSettings', JSON.stringify(data));
    
    toast({
      title: "Settings Saved",
      description: "Your configuration has been saved successfully.",
    });
  };

  const resetToDefaults = () => {
    form.reset();
    localStorage.removeItem('hardwareDebuggerSettings');
    
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults.",
    });
  };

  const testDatabaseConnection = async () => {
    setIsTestingConnection(true);
    
    try {
      const response = await fetch('/api/health');
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "Connection Successful",
          description: "Database connection is working properly.",
        });
      } else {
        throw new Error(result.message || 'Connection failed');
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect to database: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const selectFolder = async (field: string) => {
    // In a real implementation, this would use the File System Access API
    // or Electron's dialog API for folder selection
    const folder = prompt(`Enter path for ${field}:`);
    if (folder) {
      form.setValue(field as keyof SettingsFormData, folder);
    }
  };

  const exportToArduino = () => {
    toast({
      title: "Export to Arduino",
      description: "This feature will be available in a future update.",
    });
  };

  const openInVSCode = () => {
    toast({
      title: "Open in VSCode",
      description: "This feature will be available in a future update.",
    });
  };

  return (
    <div className="h-full p-6 overflow-auto">
      <div className="max-w-4xl">
        <h2 className="text-2xl font-semibold mb-6">Settings</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              {/* Hardware Settings */}
              <Card className="bg-hw-darker border-gray-700">
                <CardHeader>
                  <CardTitle>Hardware Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="defaultSpiClock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default SPI Clock Speed</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="bg-hw-code border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="125">125 kHz</SelectItem>
                              <SelectItem value="250">250 kHz</SelectItem>
                              <SelectItem value="500">500 kHz</SelectItem>
                              <SelectItem value="1000">1 MHz</SelectItem>
                              <SelectItem value="2000">2 MHz</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="autoDetectChip"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm text-gray-300">
                            Auto-detect chip on connect
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="verifyAfterWrite"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm text-gray-300">
                            Verify after write operations
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="enableFlowControl"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm text-gray-300">
                            Enable hardware flow control
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="connectionTimeout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Connection Timeout (ms)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            className="bg-hw-code border-gray-600 text-white"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* API Configuration */}
              <Card className="bg-hw-darker border-gray-700">
                <CardHeader>
                  <CardTitle>API Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="openaiApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OpenAI API Key</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type={showApiKey ? "text" : "password"}
                              placeholder="sk-..."
                              className="bg-hw-code border-gray-600 text-white pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-1"
                            >
                              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <p className="text-xs text-gray-500">
                          Used for AI-powered chipset research and identification
                        </p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aiModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Model</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="bg-hw-code border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                              <SelectItem value="gpt-4">gpt-4</SelectItem>
                              <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxTokens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Tokens per Request</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            className="bg-hw-code border-gray-600 text-white"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Database Settings */}
              <Card className="bg-hw-darker border-gray-700">
                <CardHeader>
                  <CardTitle>Database Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="databaseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PostgreSQL Connection</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="postgresql://user:pass@localhost:5432/hwdebugger"
                            className="bg-hw-code border-gray-600 text-white font-mono text-sm"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={testDatabaseConnection}
                      disabled={isTestingConnection}
                      className="flex-1 bg-hw-success hover:bg-hw-success/80"
                    >
                      {isTestingConnection ? "Testing..." : "Test Connection"}
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 bg-hw-primary hover:bg-hw-primary/80"
                      onClick={() => {
                        toast({
                          title: "Schema Migration",
                          description: "Run 'npm run db:push' to migrate database schema.",
                        });
                      }}
                    >
                      Migrate Schema
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="autoSaveHistory"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm text-gray-300">
                            Auto-save connection history
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cacheChipData"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm text-gray-300">
                            Cache chip data locally
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Integration Settings */}
              <Card className="bg-hw-darker border-gray-700">
                <CardHeader>
                  <CardTitle>Tool Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="arduinoPath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arduino IDE Path</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Input
                              {...field}
                              placeholder="/Applications/Arduino.app"
                              className="flex-1 bg-hw-code border-gray-600 text-white rounded-r-none"
                            />
                            <Button
                              type="button"
                              onClick={() => selectFolder('arduinoPath')}
                              className="bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded-l-none"
                            >
                              <FolderOpen className="w-4 h-4" />
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vscodePath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VSCode Executable</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Input
                              {...field}
                              placeholder="/usr/local/bin/code"
                              className="flex-1 bg-hw-code border-gray-600 text-white rounded-r-none"
                            />
                            <Button
                              type="button"
                              onClick={() => selectFolder('vscodePath')}
                              className="bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded-l-none"
                            >
                              <FolderOpen className="w-4 h-4" />
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="librepCBPath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LibrePCB Projects Folder</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Input
                              {...field}
                              placeholder="~/LibrePCB-Workspace"
                              className="flex-1 bg-hw-code border-gray-600 text-white rounded-r-none"
                            />
                            <Button
                              type="button"
                              onClick={() => selectFolder('librepCBPath')}
                              className="bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded-l-none"
                            >
                              <FolderOpen className="w-4 h-4" />
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={exportToArduino}
                      className="flex-1 bg-hw-primary hover:bg-hw-primary/80"
                    >
                      Export to Arduino
                    </Button>
                    <Button
                      type="button"
                      onClick={openInVSCode}
                      className="flex-1 bg-hw-secondary hover:bg-hw-secondary/80"
                    >
                      Open in VSCode
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                onClick={resetToDefaults}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button
                type="submit"
                className="bg-hw-primary hover:bg-hw-primary/80"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
