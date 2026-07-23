import React, { useState } from 'react';
import { createPortal } from 'react-dom';

export const getCategoryColor = (category) => {
    const colors = {
        'Special Camp': '#8b5cf6',
        'Blood Donation': '#ef4444',
        'Tree Plantation': '#10b981',
        'Cleanliness Drive': '#f59e0b',
        'Cleanliness Rally': '#f59e0b',
        'Awareness Programme': '#3b82f6',
        'Conference': '#8b5cf6',
        'Seminar': '#6366f1',
        'Workshop': '#ec4899',
        'Sports': '#14b8a6',
        'Cultural': '#a855f7',
        'Health': '#f97316',
        'Environmental': '#22c55e',
        'Social': '#06b6d4',
        'Exhibition': '#e11d48',
        'Road Safety Awareness': '#0ea5e9',
    };
    return colors[category] || '#6366f1';
};

const monthNames = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];

const EventsCalendar = ({ events = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDayEvents, setSelectedDayEvents] = useState(null);
    const [selectedDateLabel, setSelectedDateLabel] = useState('');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const getEventsForDate = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(ev => {
            if (ev.singleDay) return ev.date === dateStr;
            const from = new Date(ev.dateFrom);
            const to = new Date(ev.dateTo);
            const cur = new Date(dateStr);
            return cur >= from && cur <= to;
        });
    };

    const handleDayClick = (day, dayEvents) => {
        if (dayEvents.length > 0) {
            setSelectedDayEvents(dayEvents);
            setSelectedDateLabel(`${monthNames[month]} ${day}, ${year}`);
        }
    };

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToday = () => setCurrentDate(new Date());

    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} style={{ padding: '6px' }} />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEvents = getEventsForDate(day);
        const today = new Date();
        const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
        const hasEvents = dayEvents.length > 0;

        days.push(
            <div
                key={day}
                onClick={() => handleDayClick(day, dayEvents)}
                onMouseEnter={e => { if (hasEvents) e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isToday ? 'rgba(99,102,241,0.18)' : 'transparent'; }}
                style={{
                    padding: '4px 2px',
                    borderRadius: '8px',
                    background: isToday ? 'rgba(99,102,241,0.18)' : 'transparent',
                    border: isToday ? '1.5px solid rgba(99,102,241,0.5)' : '1.5px solid transparent',
                    minHeight: '64px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: hasEvents ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                    overflow: 'hidden',
                    gap: '2px',
                }}
            >
                <span style={{
                    fontSize: '0.82rem',
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? 'var(--primary-color)' : 'var(--txt-1)',
                    lineHeight: 1,
                    marginBottom: '3px',
                }}>
                    {day}
                </span>
                {dayEvents.slice(0, 3).map((ev, idx) => (
                    <div key={idx} title={ev.name} style={{
                        width: '100%',
                        fontSize: '0.6rem',
                        fontWeight: 600,
                        background: getCategoryColor(ev.category),
                        color: '#fff',
                        borderRadius: '3px',
                        padding: '1px 3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.4,
                    }}>
                        {ev.name}
                    </div>
                ))}
                {dayEvents.length > 3 && (
                    <span style={{ fontSize: '0.58rem', color: 'var(--txt-3)', fontWeight: 600 }}>
                        +{dayEvents.length - 3} more
                    </span>
                )}
            </div>
        );
    }

    return (
        <div>
            {/* Calendar Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <button className="btn btn-sm btn-secondary" onClick={prevMonth}>←</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: 'var(--txt-1)' }}>
                        {monthNames[month]} {year}
                    </h3>
                    <button className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }} onClick={goToday}>
                        Today
                    </button>
                </div>
                <button className="btn btn-sm btn-secondary" onClick={nextMonth}>→</button>
            </div>

            {/* Day-of-week headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                    <div key={d} style={{
                        textAlign: 'center',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--txt-3)',
                        padding: '4px 0',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                    }}>
                        {d}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {days}
            </div>

            {/* Legend */}
            <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {[...new Set(events.map(e => e.category).filter(Boolean))].slice(0, 8).map(cat => (
                    <span key={cat} style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '0.68rem', color: 'var(--txt-2)', fontWeight: 500,
                    }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: getCategoryColor(cat), display: 'inline-block' }} />
                        {cat}
                    </span>
                ))}
            </div>

            {/* Day Events Modal */}
            {selectedDayEvents && createPortal(
                <div className="modal-overlay" onClick={() => setSelectedDayEvents(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className="flex-between mb-4">
                            <div>
                                <h2 className="mb-1">Events on {selectedDateLabel}</h2>
                                <p className="text-muted mb-0">{selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''} scheduled</p>
                            </div>
                            <button className="btn btn-sm btn-secondary" onClick={() => setSelectedDayEvents(null)}>&times;</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {selectedDayEvents.map((event, idx) => (
                                <div key={idx} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', borderLeft: `4px solid ${getCategoryColor(event.category)}` }}>
                                    <div className="flex-between mb-2">
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{event.name}</h3>
                                        <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{event.eventCode}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                        <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>{event.category}</span>
                                        {event.level && <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(99,102,241,0.1)', color: 'var(--primary-color)' }}>{event.level}</span>}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.82rem' }}>
                                        <div>
                                            <span style={{ color: 'var(--txt-3)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Date</span>
                                            <p style={{ margin: 0, fontWeight: 600 }}>
                                                {event.singleDay ? event.date : `${event.dateFrom} → ${event.dateTo}`}
                                            </p>
                                        </div>
                                        {event.venue && (
                                            <div>
                                                <span style={{ color: 'var(--txt-3)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Venue</span>
                                                <p style={{ margin: 0, fontWeight: 600 }}>{event.venue}</p>
                                            </div>
                                        )}
                                        {event.timeFrom && (
                                            <div>
                                                <span style={{ color: 'var(--txt-3)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Time</span>
                                                <p style={{ margin: 0, fontWeight: 600 }}>{event.timeFrom}{event.timeTo ? ` – ${event.timeTo}` : ''}</p>
                                            </div>
                                        )}
                                        {event.unitId?.unitNumber && (
                                            <div>
                                                <span style={{ color: 'var(--txt-3)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Unit</span>
                                                <p style={{ margin: 0, fontWeight: 600 }}>{event.unitId.unitNumber}</p>
                                            </div>
                                        )}
                                        {event.collegeId?.insName && (
                                            <div>
                                                <span style={{ color: 'var(--txt-3)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>College</span>
                                                <p style={{ margin: 0, fontWeight: 600 }}>{event.collegeId.insName}</p>
                                            </div>
                                        )}
                                    </div>
                                    {event.description && (
                                        <p style={{ margin: '0.75rem 0 0', fontSize: '0.82rem', color: 'var(--txt-2)', lineHeight: 1.5 }}>{event.description}</p>
                                    )}
                                    {event.report?.submittedAt && (
                                        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', fontSize: '0.78rem' }}>
                                            <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Report Submitted</span>
                                            {event.report.participantsCount && <span style={{ color: 'var(--txt-2)', marginLeft: '0.75rem' }}>{event.report.participantsCount} participants</span>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setSelectedDayEvents(null)}>Close</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default EventsCalendar;
