/**
 * Shared mock implementations for task-manager component tests
 */
import React from 'react';

// Common react-dnd mocks
export const reactDndMocks = {
  DndProvider: ({ children }: any) => <div>{children}</div>,
  useDrag: () => [{}, jest.fn()],
  useDrop: () => [{}, jest.fn()],
};

export const reactDndHtml5BackendMock = {
  HTML5Backend: {},
};

// Common @efficio/ui mocks for task-manager
export const efficioUIMocks = {
  Badge: ({ children, className, ...props }: any) => (
    <span className={className} {...props}>{children}</span>
  ),
  Progress: ({ value, className }: any) => (
    <div data-testid="progress" className={className} data-value={value} />
  ),
  Popover: ({ children, open, onOpenChange }: any) => (
    <div data-testid="popover" data-open={open}>
      {children}
    </div>
  ),
  PopoverTrigger: ({ children, asChild }: any) => (
    <div data-testid="popover-trigger">{children}</div>
  ),
  PopoverContent: ({ children }: any) => (
    <div data-testid="popover-content">{children}</div>
  ),
  Slider: ({ value, onValueChange, min, max }: any) => (
    <input
      type="range"
      data-testid="slider"
      value={value?.[0] || 0}
      min={min}
      max={max}
      onChange={(e) => onValueChange?.([Number.parseInt(e.target.value)])}
    />
  ),
  Avatar: ({ children, className }: any) => (
    <div className={className} data-testid="avatar">{children}</div>
  ),
  AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt} data-testid="avatar-image" />,
  AvatarFallback: ({ children, className }: any) => (
    <div className={className} data-testid="avatar-fallback">{children}</div>
  ),
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>{children}</button>
  ),
  ScrollArea: ({ children }: any) => <div data-testid="scroll-area">{children}</div>,
  Separator: ({ className }: any) => <hr className={className} />,
  Dialog: ({ children, open, onOpenChange }: any) => (
    open ? <div data-testid="dialog">{children}</div> : null
  ),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  Input: ({ value, onChange, placeholder, ...props }: any) => (
    <input value={value} onChange={onChange} placeholder={placeholder} {...props} />
  ),
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
  Switch: ({ checked, onCheckedChange, id }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid={`switch-${id}`}
    />
  ),
  Select: ({ children, value, onValueChange }: any) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
};

// Common framer-motion mocks
export const framerMotionMocks = {
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children, mode }: any) => <div data-mode={mode}>{children}</div>,
};

// Common lucide-react icon mocks
export const lucideReactMocks = {
  Calendar: () => <svg data-testid="calendar-icon" />,
  Circle: () => <svg data-testid="circle-icon" />,
  MoreVertical: () => <svg data-testid="more-vertical-icon" />,
  Edit: () => <svg data-testid="edit-icon" />,
  Trash2: () => <svg data-testid="trash-icon" />,
  Users: () => <svg data-testid="users-icon" />,
};

