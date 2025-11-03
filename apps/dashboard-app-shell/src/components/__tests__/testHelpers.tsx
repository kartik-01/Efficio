/**
 * Shared test utilities for component tests
 */
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

/**
 * Renders a component wrapped in BrowserRouter
 */
export const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

/**
 * Common mock for @efficio/ui components
 */
export const mockEfficioUI = () => {
  jest.mock('@efficio/ui', () => ({
    Button: ({ children, asChild, onClick, ...props }: any) => {
      if (asChild) {
        return <div>{children}</div>;
      }
      return <button onClick={onClick} {...props}>{children}</button>;
    },
    Card: ({ children, className }: any) => (
      <div data-testid="card" className={className}>{children}</div>
    ),
    CardHeader: ({ children }: any) => <div>{children}</div>,
    CardTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
    CardDescription: ({ children, className }: any) => <p className={className}>{children}</p>,
    CardContent: ({ children }: any) => <div>{children}</div>,
    CardFooter: ({ children, className }: any) => <div className={className}>{children}</div>,
    Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
    DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
    DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <p>{children}</p>,
    Input: (props: any) => <input {...props} />,
    Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
    Avatar: ({ children }: any) => <div>{children}</div>,
    AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
    AvatarFallback: ({ children }: any) => <div>{children}</div>,
    AlertDialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
    AlertDialogContent: ({ children }: any) => <div>{children}</div>,
    AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
    AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
    AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
    AlertDialogAction: ({ children, onClick }: any) => (
      <button onClick={onClick}>{children}</button>
    ),
    AlertDialogCancel: ({ children, onClick }: any) => (
      <button onClick={onClick}>{children}</button>
    ),
    RadioGroup: ({ children, value, onValueChange }: any) => {
      (global as any).__radioGroupHandler = onValueChange;
      (global as any).__radioGroupValue = value;
      return (
        <div 
          data-testid="radio-group" 
          data-value={value}
          data-handler-present={onValueChange ? 'yes' : 'no'}
        >
          {React.Children.map(children, (child) => {
            const { onValueChange: _, currentValue: __, ...restProps } = child.props || {};
            return React.cloneElement(child, { 
              ...restProps,
              'data-radio-value': value,
              mockOnChangeHandler: onValueChange,
            });
          })}
        </div>
      );
    },
    RadioGroupItem: (props: any) => {
      const { value, id, mockOnChangeHandler: onValueChange, 'data-radio-value': currentValue, ...restProps } = props;
      const handler = onValueChange || (global as any).__radioGroupHandler;
      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (typeof handler === 'function') {
          handler(value);
        }
      };
      const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const finalHandler = handler || onValueChange || (global as any).__radioGroupHandler;
        if (typeof finalHandler === 'function') {
          const target = e.target as HTMLInputElement;
          target.checked = true;
          finalHandler(value);
        }
      };
      return (
        <input 
          type="radio" 
          id={id} 
          value={value} 
          checked={currentValue === value}
          onClick={handleClick}
          onChange={handleChange}
          data-testid={`radio-${value}`}
          {...restProps} 
        />
      );
    },
  }));
};

/**
 * Common mock for framer-motion
 */
export const mockFramerMotion = () => {
  jest.mock('framer-motion', () => ({
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  }));
};

/**
 * Common mock for lucide-react icons
 */
export const mockLucideReact = (icons: Record<string, () => React.ReactElement> = {}) => {
  const defaultIcons = {
    ArrowRight: () => <div data-testid="arrow-icon" />,
    Camera: () => <div data-testid="camera-icon" />,
    Save: () => <div data-testid="save-icon" />,
    X: () => <div data-testid="x-icon" />,
  };
  
  jest.mock('lucide-react', () => ({
    ...defaultIcons,
    ...icons,
  }));
};

/**
 * Common mock for @auth0/auth0-react
 */
export const mockAuth0 = () => {
  jest.mock('@auth0/auth0-react', () => ({
    useAuth0: jest.fn(),
    Auth0Provider: ({ children }: any) => <div>{children}</div>,
  }));
};

