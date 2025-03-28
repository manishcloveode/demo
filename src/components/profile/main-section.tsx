"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Plus, Twitter, Youtube, Github, Coffee, Smartphone, Trash2, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { DragEndEvent } from "@dnd-kit/core";

// Define the card data structure
interface CardData {
    id: string
    type: "twitter" | "youtube" | "github" | "coffee" | "mastodon" | "ios"
    title: string
    subtitle?: string
    buttonText?: string
    buttonUrl?: string
    imageUrl?: string
    width?: number
    height?: number
    gridColumn?: number
    gridRow?: number
}

// Create a component for the sortable card
function SortableCard({ card, onDelete, onResize, gridSize }: {
    card: CardData;
    onDelete: (id: string) => void;
    onResize: (id: string, width: number, height: number, gridColumn: number) => void;
    gridSize: { columns: number, gap: number };
}) {
    const [isResizing, setIsResizing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const initialPos = useRef({ x: 0, y: 0 });
    const initialSize = useRef({ width: 0, height: 0 });
    const cardRef = useRef<HTMLDivElement>(null);

    // Setup sortable hooks with disabled property
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: card.id,
        disabled: isResizing // Disable dragging while resizing
    });

    // Apply styles conditionally
    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isResizing ? undefined : transition,
        width: card.width ? `${card.width}px` : "100%",
        height: card.height ? `${card.height}px` : "auto",
        // Use grid span if defined
        gridColumn: card.gridColumn ? `span ${card.gridColumn}` : undefined,
        gridRow: card.gridRow ? `span ${card.gridRow}` : undefined,
    };

    // Calculate grid span based on card size
    const calculateGridSpan = (width: number) => {
        if (!gridSize.columns) return 1;

        // Get the container width (approximation based on columns and gap)
        const containerWidth = cardRef.current?.parentElement?.offsetWidth || 0;
        if (containerWidth === 0) return 1;

        // Calculate single column width (container width - total gaps) / columns
        const singleColWidth = (containerWidth - (gridSize.gap * (gridSize.columns - 1))) / gridSize.columns;

        // Determine how many columns this card should span (rounded up)
        const span = Math.max(1, Math.min(
            gridSize.columns,
            Math.ceil((width + gridSize.gap) / (singleColWidth + gridSize.gap))
        ));

        return span;
    };

    // Handle resize start
    const handleResizeStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (cardRef.current) {
            setIsResizing(true);
            initialPos.current = { x: e.clientX, y: e.clientY };
            initialSize.current = {
                width: cardRef.current.offsetWidth,
                height: cardRef.current.offsetHeight
            };
        }
    };

    // Handle resize move and end using useEffect
    useEffect(() => {
        if (!isResizing) return;

        // Mouse move handler
        const handleMouseMove = (e: MouseEvent) => {
            if (cardRef.current) {
                const deltaX = e.clientX - initialPos.current.x;
                const deltaY = e.clientY - initialPos.current.y;

                const newWidth = Math.max(150, initialSize.current.width + deltaX);
                const newHeight = Math.max(150, initialSize.current.height + deltaY);

                cardRef.current.style.width = `${newWidth}px`;
                cardRef.current.style.height = `${newHeight}px`;
            }
        };

        // Mouse up handler
        const handleMouseUp = () => {
            setIsResizing(false);
            if (cardRef.current) {
                const newWidth = cardRef.current.offsetWidth;
                const newHeight = cardRef.current.offsetHeight;

                // Calculate grid spans
                const gridColumn = calculateGridSpan(newWidth);

                // Update with new dimensions and grid spans
                onResize(
                    card.id,
                    newWidth,
                    newHeight,
                    gridColumn
                );
            }
        };

        // Add event listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // Clean up
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, card.id, onResize, gridSize]);

    return (
        <div
            ref={(node) => {
                setNodeRef(node);
                if (node) {
                    cardRef.current = node;
                }
            }}
            style={style}
            className={`relative touch-manipulation ${isDragging ? 'z-10' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            {...(isResizing ? {} : attributes)}
            {...(isResizing ? {} : listeners)}
        >
            <Card className="w-full h-full bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                    {card.type === "twitter" && (
                        <div className="flex flex-col items-center space-y-2">
                            <Twitter className="h-6 w-6 text-blue-400" />
                            <p className="text-sm font-medium">{card.title}</p>
                        </div>
                    )}

                    {card.type === "youtube" && (
                        <div className="flex flex-col items-center space-y-2">
                            <Youtube className="h-6 w-6 text-red-500" />
                            <p className="text-sm font-medium">{card.title}</p>
                        </div>
                    )}

                    {card.type === "github" && (
                        <div className="flex flex-col items-center space-y-2">
                            <Github className="h-6 w-6" />
                            <p className="text-sm font-medium">{card.title}</p>
                            <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: 35 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-3 h-3 rounded-sm ${Math.random() > 0.7 ? `bg-green-${Math.floor(Math.random() * 3 + 3)}00` : "bg-gray-100"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {card.type === "coffee" && (
                        <div className="flex flex-col items-center space-y-2">
                            <Coffee className="h-6 w-6 text-yellow-500" />
                            <p className="text-sm font-medium">{card.title}</p>
                        </div>
                    )}

                    {card.type === "mastodon" && (
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                    <span className="text-white text-xs">M</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{card.title}</p>
                                    <p className="text-xs text-gray-500">{card.subtitle}</p>
                                </div>
                            </div>
                            {card.imageUrl && (
                                <div className="mt-2">
                                    <Image
                                        src={card.imageUrl || "/placeholder.svg"}
                                        alt="App screenshot"
                                        width={150}
                                        height={80}
                                        className="rounded-md"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {card.type === "ios" && (
                        <div className="flex flex-col items-center space-y-2">
                            <Smartphone className="h-6 w-6 text-gray-800" />
                            <p className="text-sm font-medium">{card.title}</p>
                        </div>
                    )}
                </CardContent>

                {card.buttonText && (
                    <CardFooter className="p-2 pt-0 flex justify-center">
                        <Button
                            variant={card.type === "youtube" ? "destructive" : "secondary"}
                            size="sm"
                            className={`w-full ${card.type === "twitter"
                                ? "bg-blue-400 hover:bg-blue-500 text-white"
                                : card.type === "mastodon"
                                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                                    : ""
                                }`}
                        >
                            {card.buttonText}
                        </Button>
                    </CardFooter>
                )}
            </Card>

            {/* Delete button that appears on hover */}
            {isHovered && (
                <button
                    className="absolute top-2 right-2 bg-red-100 hover:bg-red-200 rounded-full p-1 transition-colors z-10"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(card.id);
                    }}
                >
                    <Trash2 className="h-4 w-4 text-red-500" />
                </button>
            )}

            {/* Resize handle */}
            {isHovered && (
                <div
                    className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-center justify-center z-10"
                    onMouseDown={handleResizeStart}
                >
                    <ChevronsUpDown className="h-4 w-4 text-gray-500 rotate-45" />
                </div>
            )}
        </div>
    );
}

export default function ProfilePage() {
    // Generate a unique ID
    const generateId = () => Math.random().toString(36).substring(2, 9);

    // Grid configuration
    const [gridSize, setGridSize] = useState({
        columns: 3,  // Default for lg screens
        gap: 16      // 4 in tailwind = 16px
    });

    // Update grid size based on screen width
    useEffect(() => {
        const updateGridSize = () => {
            if (window.innerWidth >= 1024) {
                setGridSize({ columns: 3, gap: 16 }); // lg:grid-cols-3
            } else if (window.innerWidth >= 640) {
                setGridSize({ columns: 2, gap: 16 }); // sm:grid-cols-2
            } else {
                setGridSize({ columns: 1, gap: 16 }); // grid-cols-1
            }
        };

        // Initial setup
        updateGridSize();

        // Listen for window resize
        window.addEventListener('resize', updateGridSize);

        // Cleanup
        return () => window.removeEventListener('resize', updateGridSize);
    }, []);

    // Initial cards data
    const [cards, setCards] = useState<CardData[]>([
        { id: "1", type: "twitter", title: "My Tweeet's", buttonText: "Follow", gridColumn: 1 },
        { id: "2", type: "youtube", title: "Some Tutorials", buttonText: "Subscribe", gridColumn: 1 },
        { id: "3", type: "github", title: "Github", gridColumn: 1 },
        { id: "4", type: "coffee", title: "Buy me a Coffee", buttonText: "Support", gridColumn: 1 },
        {
            id: "5",
            type: "mastodon",
            title: "Ivory for Mastodon",
            subtitle: "by Tapbots",
            buttonText: "Get",
            imageUrl: "/placeholder.svg?height=80&width=150",
            gridColumn: 1
        },
        { id: "6", type: "ios", title: "iOS UI Kit", gridColumn: 1 },
    ]);

    // Handle card deletion
    const handleDeleteCard = (id: string) => {
        setCards(cards.filter(card => card.id !== id));
    };

    // Handle card resizing with grid columns
    const handleResizeCard = (id: string, width: number, height: number, gridColumn: number) => {
        setCards(cards.map(card =>
            card.id === id ? { ...card, width, height, gridColumn } : card
        ));
    };

    // Handle card duplication
    const handleDuplicateCard = () => {
        if (cards.length > 0) {
            const firstCard = cards[0];
            const newCard = {
                ...firstCard,
                id: generateId(),
                title: `${firstCard.title} (Copy)`
            };

            setCards([...cards, newCard]);
        }
    };

    // Set up DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setCards((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Profile Section */}
                    <div className="md:w-1/3 flex flex-col items-center md:items-start">
                        <div className="w-64 h-64 rounded-full overflow-hidden mb-4">
                            <Image
                                src="/user.webp"
                                alt="Profile"
                                width={300}
                                height={300}
                                className="object-cover"
                            />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">User</h1>
                        <p className="text-gray-600 mb-6 text-center md:text-left">
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempore, fugit?
                        </p>
                    </div>

                    {/* Cards Section */}
                    <div className="md:w-2/3">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={cards.map((card) => card.id)}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {cards.map((card) => (
                                        <SortableCard
                                            key={card.id}
                                            card={card}
                                            onDelete={handleDeleteCard}
                                            onResize={handleResizeCard}
                                            gridSize={gridSize}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>
            </div>
            <Dialog>
                <DialogTrigger>
                    <Button
                        onClick={handleDuplicateCard}
                        className="h-14 w-14 rounded-full fixed bottom-6 right-6 shadow-lg" size="icon">
                        <Plus className="h-6 w-6" />
                    </Button>
                </DialogTrigger>
            </Dialog>
        </div>
    );
}