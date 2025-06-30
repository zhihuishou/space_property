import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { fetchLayoutData } from '../api/api';

interface SeatElement {
  id: number;
  refEntityNo: string;
  pointX: number;
  pointY: number;
  rotate: number;
  showName: string;
  height: number;
  width: number;
  elementCode: string;
  displayName: string;
  borderTop?: boolean;
  borderRight?: boolean;
  borderBottom?: boolean;
  borderLeft?: boolean;
  borderTopSite?: boolean;
  borderRightSite?: boolean;
  borderBottomSite?: boolean;
  borderLeftSite?: boolean;
  overlay?: 'none' | 'seatingRate' | 'RevPAC' | 'avgPrice' | 'setPrice' | 'Discount';
  avgPrice?: number;
  setPrice?: number;
  discount?: number;
  seatingRate?: number;
  RevPAC?: number;
}
interface NonBusinessArea {
  id: number;
  areaCode: string;
  areaName: string;
  direction: string;
  pointX: number;
  pointY: number;
  rotate: number;
  showName: string;
  height: number;
  width: number;
  elementCode: string;
  displayName: string;
}


interface Area {
  id: number;
  areaCode: string;
  areaName: string;
  direction: string;
  elements: SeatElement[];
  relations: { roomId: number, seatIds: number[] }[];
  displayName: string;
}


interface SeatProps {
  number: number;
  isOccupied?: boolean;
  onClick?: () => void;
  element?: SeatElement;
  overlay?: 'none' | 'seatingRate' | 'RevPAC' | 'avgPrice' | 'setPrice' | 'Discount';
  minAvgPrice?: number;
  maxAvgPrice?: number;
  showSeatNumber?: boolean;
  overlayValue?: number;
  overlayMin?: number;
  overlayMax?: number;
  showOverlayValue?: boolean;
}

const FRAME_WIDTH = 1200;  // Fixed frame width
const FRAME_HEIGHT = 1000; // Fixed frame height
const SEAT_SIZE = 60;    // Default seat size

// Function to filter and scale coordinates
const filterAndScaleSeats = (
  elements: SeatElement[],
): SeatElement[] => {
  // First filter only SEAT elements
  const seatElements = elements.filter(element => element.elementCode === 'SEAT');


  if (seatElements.length === 0) return [];

  // Find the min and max coordinates
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  seatElements.forEach(point => {
    minX = Math.min(minX, point.pointX);
    maxX = Math.max(maxX, point.pointX);
    minY = Math.min(minY, point.pointY);
    maxY = Math.max(maxY, point.pointY);
  });

  // Calculate the scale factors
  const xRange = maxX - minX;
  const yRange = maxY - minY;
  const xScale = (FRAME_WIDTH - SEAT_SIZE) / (xRange || 1);
  const yScale = (FRAME_HEIGHT - SEAT_SIZE) / (yRange || 1);
  
  // Use the smaller scale to maintain aspect ratio
  const scale = Math.min(xScale, yScale);

  // Calculate the offset to center the seats
  const xOffset = (FRAME_WIDTH - (xRange * scale)) / 2;
  const yOffset = (FRAME_HEIGHT - (yRange * scale)) / 2;

  // Scale and translate all points, with 25% enlargement
  const enlargementFactor = 0.8; // 25% larger
  return seatElements.map(point => ({
    ...point,
    pointX: ((point.pointX - minX) * scale) + xOffset - (SEAT_SIZE * (enlargementFactor - 1)) / 2,
    pointY: ((point.pointY - minY) * scale) + yOffset - (SEAT_SIZE * (enlargementFactor - 1)) / 2,
    width: point.width ? Math.min(point.width * scale * enlargementFactor, SEAT_SIZE * enlargementFactor) : SEAT_SIZE * enlargementFactor,
    height: point.height ? Math.min(point.height * scale * enlargementFactor, SEAT_SIZE * enlargementFactor) : SEAT_SIZE * enlargementFactor,
    avgPrice: point.avgPrice ?? Math.random() * 10 + 5,
    setPrice: point.setPrice ?? Math.random() * 10 + 5,
    discount: point.discount ?? Math.random() * 10 + 5,
    seatingRate: point.seatingRate ?? Math.random() * 10 + 5,
    RevPAC: point.RevPAC ?? Math.random() * 10 + 5,
  }));
};

const filterAndScaleRooms = (elements: SeatElement[]): SeatElement[] => {
  if (elements.length === 0) return [];

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  elements.forEach(point => {
    minX = Math.min(minX, point.pointX);
    maxX = Math.max(maxX, point.pointX);
    minY = Math.min(minY, point.pointY);
    maxY = Math.max(maxY, point.pointY);
  });

  const xRange = maxX - minX;
  const yRange = maxY - minY;
  const xScale = (FRAME_WIDTH - SEAT_SIZE) / (xRange || 1);
  const yScale = (FRAME_HEIGHT - SEAT_SIZE) / (yRange || 1);
  const scale = Math.min(xScale, yScale);

  const xOffset = (FRAME_WIDTH - (xRange * scale)) / 2;
  const yOffset = (FRAME_HEIGHT - (yRange * scale)) / 2;

  const enlargementFactor = 0.8; // You can adjust this

  return elements.map(point => ({
    ...point,
    pointX: ((point.pointX - minX) * scale) + xOffset - (point.width * scale * (enlargementFactor - 1)) / 2,
    pointY: ((point.pointY - minY) * scale) + yOffset - (point.height * scale * (enlargementFactor - 1)) / 2,
    width: point.width ? point.width * scale * enlargementFactor : SEAT_SIZE * enlargementFactor,
    height: point.height ? point.height * scale * enlargementFactor : SEAT_SIZE * enlargementFactor,
  }));
};



const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0px;
  padding: 0px;
  background-color: #f5f5f5;
  width: 100%;
  height: 100%;
  min-height: ${FRAME_HEIGHT}px;
`;

const Section = styled.div<{ area: string }>`

  padding: 100px;
  background: white;
  border-radius: 4px;
  position: relative;
  width: ${FRAME_WIDTH}px;
  height: ${FRAME_HEIGHT}px;
  margin: 0 auto;
`;

interface StyledSeatProps {
  $isOccupied?: boolean;
}

const StyledSeat = styled.div<StyledSeatProps>`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;

  &:hover {
    transform: scale(1.05);
    filter: brightness(1.1);
  }
`;

const SeatImageWrapper = styled.div<StyledSeatProps>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: ${props => props.$isOccupied ? 0.7 : 1};
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const SeatNumber = styled.span`
  position: absolute;
  z-index: 1;
  color: #313131;
  font-weight: normal;
  font-size: 14px;
`;

const NonBusinessArea = styled.div`
  padding: 10px;
  background: #f8f8f8;
  border: px dashed #999;
  text-align: center;
  color: #666;
`;
const SEAT_LOGO = "data:image/png;base64,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";

function getGradientColor(value: number, min: number, max: number): string {
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const r = Math.round(255 * ratio); // 0 (green) to 255 (red)
  const g = Math.round(200 * (1 - ratio)); // 200 (green) to 0 (red)
  return `rgba(${r},${g},0,0.4)`;
  
}

const SeatComponent: React.FC<SeatProps> = ({ number, isOccupied, onClick, element, overlay, minAvgPrice, maxAvgPrice, showSeatNumber, overlayValue, overlayMin, overlayMax, showOverlayValue }) => {
  // Add 180 degrees to the existing rotation
  const totalRotation = (element?.rotate || 0) + 180;

  // Determine overlay color
  let overlayColor = 'transparent';
  if (
    overlay !== 'none' &&
    overlayValue !== undefined &&
    overlayMin !== undefined &&
    overlayMax !== undefined
  ) {
    overlayColor = getGradientColor(overlayValue, overlayMin, overlayMax);
  }

  return (
    <StyledSeat 
      onClick={onClick}
      style={{
        left: `${element?.pointX || 0}px`,
        top: `${element?.pointY || 0}px`,
        width: `${element?.width || 100}px`,
        height: `${element?.height || 100}px`,
        background: 'transparent',
      }}
    >
      <SeatImageWrapper 
        $isOccupied={isOccupied}
        style={{
          transform: `rotate(${totalRotation}deg)`,
          zIndex: 1,
          position: 'relative',
        }}
      >
        <img src={SEAT_LOGO} alt={`seat-${number}`} />
        {/* Overlay color only on the logo */}
        {overlay !== 'none' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: overlayColor,
              zIndex: 2,
              pointerEvents: 'none',
              borderRadius: '2px',
              mixBlendMode: 'multiply',
            }}
          />
        )}
      </SeatImageWrapper>
      {showSeatNumber && !showOverlayValue && (
        <SeatNumber style={{zIndex: 3}}>{element?.displayName || number}</SeatNumber>
      )}
      {/* Show overlay value as a label below the seat number if overlay is active and showOverlayValue is true */}
      {showOverlayValue && overlay !== 'none' && typeof overlayValue === 'number' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: Math.max(8, Math.min(20, (element?.width || 60) * 0.25)),
          color: '#333',
          zIndex: 4,
          pointerEvents: 'none',
          fontWeight: 500,
          padding: '0 4px',
        }}>
          {overlayValue.toFixed(2)}
        </div>
      )}
    </StyledSeat>
  );
};

// Add this interface for props
interface SeatingLayoutProps {
  overlay: 'none' | 'seatingRate' | 'RevPAC' | 'avgPrice' | 'setPrice' | 'Discount';
  showSeatNumber?: boolean;
  showOverlayValue?: boolean;
  commonCode: string;
  showAvgPrice?: boolean;
  showSetPrice?: boolean;
  showDiscount?: boolean;
  showSeatingRate?: boolean;
  showRevPAC?: boolean; 
}

// Update the component to accept props
const SeatingLayout: React.FC<SeatingLayoutProps> = ({ overlay, showSeatNumber, showOverlayValue, commonCode }) => {
  const [occupiedSeats, setOccupiedSeats] = useState<number[]>([]);
  const [seatElements, setSeatElements] = useState<SeatElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [privateRooms, setPrivateRooms] = useState<SeatElement[]>([]);
  const [roomRelations, setRoomRelations] = useState<{ roomId: number, seatIds: number[] }[]>([]);
  const [minAvgPrice, setMinAvgPrice] = useState<number | undefined>(undefined);
  const [maxAvgPrice, setMaxAvgPrice] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchSeatData = async () => {
      try {
        const response =  await fetchLayoutData(commonCode);
        const areas = response.data?.areas;
        const elements = areas?.[0]?.elements;
        const relations = areas?.[0]?.relations || [];

        setRoomRelations(relations);
        
        if (Array.isArray(elements)) {
          // Seats
          const scaledSeats = filterAndScaleSeats(elements);
          setSeatElements(scaledSeats);

          // Private Rooms
          const privateRoomElements = elements.filter(e => e.elementCode === 'PRIVATE_ROOM');
          const scaledRooms = filterAndScaleRooms(privateRoomElements);
          setPrivateRooms(scaledRooms);

          // Compute min/max for each overlay type (must be in scope for seatElements.map)
          const avgPrices = elements.map(seat => seat.avgPrice ?? 0);
          const setPrices = elements.map(seat => seat.setPrice ?? 0);
          const discounts = elements.map(seat => seat.discount ?? 0);
          const seatingRates = elements.map(seat => seat.seatingRate ?? 0);
          const revPACs = elements.map(seat => seat.RevPAC ?? 0);
          const minMaxMap = {
            avgPrice: { min: Math.min(...avgPrices), max: Math.max(...avgPrices) },
            setPrice: { min: Math.min(...setPrices), max: Math.max(...setPrices) },
            Discount: { min: Math.min(...discounts), max: Math.max(...discounts) },
            seatingRate: { min: Math.min(...seatingRates), max: Math.max(...seatingRates) },
            RevPAC: { min: Math.min(...revPACs), max: Math.max(...revPACs) },
          };

          setMinAvgPrice(Math.min(...avgPrices));
          setMaxAvgPrice(Math.max(...avgPrices));

        } else {
          setError('No seat elements found in the area');
        }
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch seat data');
        setLoading(false);
      }
    };

    fetchSeatData();
  }, [commonCode]);

  const toggleSeat = (seatNumber: number) => {
    setOccupiedSeats((prev: number[]) => 
      prev.includes(seatNumber) 
        ? prev.filter((num: number) => num !== seatNumber)
        : [...prev, seatNumber]
    );
  };  

  if (loading) return <div>Loading seat data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!seatElements.length) return <div>No seat data available</div>;

  // Compute min/max for each overlay type (must be in scope for seatElements.map)
  const avgPrices = seatElements.map(seat => seat.avgPrice ?? Math.random() * 10 + 5);
  const setPrices = seatElements.map(seat => seat.setPrice ?? Math.random() * 10 + 5);
  const discounts = seatElements.map(seat => seat.discount ?? Math.random() * 10 + 5);
  const seatingRates = seatElements.map(seat => seat.seatingRate ?? Math.random() * 10 + 5);
  const RevPAC = seatElements.map(seat => seat.RevPAC ?? Math.random() * 10 + 5);
  const minMaxMap = {
    avgPrice: { min: Math.min(...avgPrices), max: Math.max(...avgPrices) },
    setPrice: { min: Math.min(...setPrices), max: Math.max(...setPrices) },
    Discount: { min: Math.min(...discounts), max: Math.max(...discounts) },
    seatingRate: { min: Math.min(...seatingRates), max: Math.max(...seatingRates) },
    RevPAC: { min: Math.min(...RevPAC), max: Math.max(...RevPAC) },
  };


  return (
    <LayoutContainer>
      <div style={{ marginBottom: 20, display: 'flex', gap: 10}}>
        {/* Remove the button for toggling showSeatNumber here, as it should be controlled by parent */}
      </div>
      <Section area="main">
        {/* Render room boundaries first so seats are on top */}
        {privateRooms.map(room => {
          // Find the relation for this room
          const relation = roomRelations.find(r => r.roomId === room.id);
          if (!relation) return null;

          // Find all seats in this room
          const seatsInRoom = seatElements.filter(seat => relation.seatIds.includes(seat.id));

          if (seatsInRoom.length === 0) return null;

          // Calculate bounding box
          const minX = Math.min(...seatsInRoom.map(s => s.pointX - s.width*0.3));
          const minY = Math.min(...seatsInRoom.map(s => s.pointY ));
          const maxX = Math.max(...seatsInRoom.map(s => s.pointX + s.width*1.5));
          const maxY = Math.max(...seatsInRoom.map(s => s.pointY + s.height*1.5));

          // Optional: add padding
          const padding = 15;
          const left = minX - padding*0.4;
          const top = minY - padding*0.6;
          const width = (maxX - minX) + 0.5 * padding;
          const height = (maxY - minY) + 0.5 * padding;

          // Draw the boundary
          return (
            <React.Fragment key={room.id + room.displayName}>
              {/* Room label */}
              <div
                style={{
                  position: 'absolute',
                  left: left,
                  top: top - 20, // 24px above the boundary, adjust as needed
                  width: width,
                  textAlign: 'center',
                  fontWeight: 500,
                  fontSize: '8px',
                  color: '#222',
                  pointerEvents: 'none',
                  zIndex: 4, // above the border
                  borderRadius: '8px 8px 0 0',
                  padding: '5px 5px',
                  whiteSpace: 'nowrap', // Prevent line breaks
                }}
              >
                {room.displayName}
              </div>
              {/* Room boundary */}
              <div
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width,
                  height,
                  border: '1.8px solid #222',
                  borderRadius: '3px',
                  pointerEvents: 'none',
                  boxSizing: 'border-box',
                  zIndex: 0,
                  background: 'transparent',
                }}
              />
            </React.Fragment>
          );
        })}
        {seatElements.map((element, index) => {
          let overlayValue, overlayMin, overlayMax;
          if (overlay === 'avgPrice') {
            overlayValue = element.avgPrice;
            overlayMin = minMaxMap.avgPrice.min;
            overlayMax = minMaxMap.avgPrice.max;
          } else if (overlay === 'setPrice') {
            overlayValue = element.setPrice;
            overlayMin = minMaxMap.setPrice.min;
            overlayMax = minMaxMap.setPrice.max;
          } else if (overlay === 'Discount') {
            overlayValue = element.discount;
            overlayMin = minMaxMap.Discount.min;
            overlayMax = minMaxMap.Discount.max;
          } else if (overlay === 'seatingRate') {
            overlayValue = element.seatingRate;
            overlayMin = minMaxMap.seatingRate.min;
            overlayMax = minMaxMap.seatingRate.max;
          } else if (overlay === 'RevPAC') {
            overlayValue = element.RevPAC;
            overlayMin = minMaxMap.RevPAC.min;
            overlayMax = minMaxMap.RevPAC.max;
          }

          return (
            <SeatComponent
              key={`seat-${element.refEntityNo || `${element.pointX}-${element.pointY}-${index}`}`}
              number={index + 1}
              isOccupied={occupiedSeats.includes(index + 1)}
              onClick={() => toggleSeat(index + 1)}
              element={element}
              overlay={overlay}
              minAvgPrice={minAvgPrice}
              maxAvgPrice={maxAvgPrice}
              showSeatNumber={showSeatNumber}
              showOverlayValue={showOverlayValue}
              overlayValue={overlayValue}
              overlayMin={overlayMin}
              overlayMax={overlayMax}
            />
          );

        })}

        
      </Section>
      <NonBusinessArea>
        非营业区
      </NonBusinessArea>
    </LayoutContainer>
  );
};

export default SeatingLayout; 