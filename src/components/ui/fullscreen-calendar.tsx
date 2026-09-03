import * as React from 'react'
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isAfter,
  isBefore,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfDay,
  startOfToday,
  startOfWeek,
} from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon, PlusCircleIcon, SearchIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useMediaQuery } from '@/hooks/use-media-query'

interface Event {
  id: number
  name: string
  time: string
  datetime: string
}

interface CalendarData {
  day: Date
  events: Event[]
}

interface FullScreenCalendarProps {
  data?: CalendarData[]
  mode?: 'events' | 'range'
  rangeFrom?: Date
  rangeTo?: Date
  onDaySelect?: (day: Date) => void
}

const colStartClasses = [
  '',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
  'col-start-7',
]

function isInRange(day: Date, from?: Date, to?: Date) {
  if (!from || !to) return false
  const start = isBefore(from, to) ? from : to
  const end = isAfter(from, to) ? from : to
  const normalized = startOfDay(day)
  return (
    (isAfter(normalized, startOfDay(start)) || isEqual(normalized, startOfDay(start))) &&
    (isBefore(normalized, startOfDay(end)) || isEqual(normalized, startOfDay(end)))
  )
}

function isRangeEdge(day: Date, from?: Date, to?: Date) {
  if (!from) return false
  if (!to) return isSameDay(day, from)
  return isSameDay(day, from) || isSameDay(day, to)
}

export function FullScreenCalendar({
  data = [],
  mode = 'events',
  rangeFrom,
  rangeTo,
  onDaySelect,
}: FullScreenCalendarProps) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = React.useState(today)
  const [currentMonth, setCurrentMonth] = React.useState(format(today, 'MMM-yyyy'))
  const firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date())
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const isRangeMode = mode === 'range'

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  })

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'))
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'))
  }

  function goToToday() {
    setCurrentMonth(format(today, 'MMM-yyyy'))
    setSelectedDay(today)
  }

  function handleDayClick(day: Date) {
    setSelectedDay(day)
    onDaySelect?.(day)
  }

  function dayCellClass(day: Date, compact = false) {
    const inRange = isRangeMode && isInRange(day, rangeFrom, rangeTo)
    const rangeEdge = isRangeMode && isRangeEdge(day, rangeFrom, rangeTo)

    return cn(
      !isRangeMode && isEqual(day, selectedDay) && 'text-primary-foreground',
      !isRangeMode &&
        !isEqual(day, selectedDay) &&
        !isToday(day) &&
        isSameMonth(day, firstDayCurrentMonth) &&
        'text-foreground',
      !isRangeMode &&
        !isEqual(day, selectedDay) &&
        !isToday(day) &&
        !isSameMonth(day, firstDayCurrentMonth) &&
        'text-muted-foreground',
      isRangeMode &&
        isSameMonth(day, firstDayCurrentMonth) &&
        !inRange &&
        !rangeEdge &&
        'text-foreground',
      isRangeMode &&
        !isSameMonth(day, firstDayCurrentMonth) &&
        !inRange &&
        !rangeEdge &&
        'text-muted-foreground',
      inRange && 'bg-primary/10',
      (isEqual(day, selectedDay) || isToday(day) || rangeEdge) && 'font-semibold',
      compact
        ? 'flex h-14 flex-col border-b border-r px-3 py-2 hover:bg-muted focus:z-10'
        : 'relative flex flex-col border-b border-r hover:bg-muted focus:z-10',
    )
  }

  function dayNumberClass(day: Date) {
    const rangeEdge = isRangeMode && isRangeEdge(day, rangeFrom, rangeTo)

    return cn(
      'flex items-center justify-center rounded-full',
      !isRangeMode &&
        isEqual(day, selectedDay) &&
        'bg-primary text-primary-foreground size-6 ml-auto',
      isRangeMode && rangeEdge && 'bg-primary text-primary-foreground size-7',
      isRangeMode && !rangeEdge && isToday(day) && 'ring-1 ring-primary size-7',
      !isRangeMode && !isEqual(day, selectedDay) && isToday(day) && 'ring-1 ring-primary size-6 ml-auto',
      !isRangeMode && !isEqual(day, selectedDay) && !isToday(day) && 'size-6 ml-auto',
      isRangeMode && !rangeEdge && !isToday(day) && 'size-7',
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none">
        <div className="flex flex-auto">
          <div className="flex items-center gap-4">
            <div className="hidden w-20 flex-col items-center justify-center rounded-lg border bg-muted p-0.5 md:flex">
              <h1 className="p-1 text-xs uppercase text-muted-foreground">{format(today, 'MMM')}</h1>
              <div className="flex w-full items-center justify-center rounded-lg border bg-background p-0.5 text-lg font-bold">
                <span>{format(today, 'd')}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-foreground">
                {format(firstDayCurrentMonth, 'MMMM, yyyy')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {format(firstDayCurrentMonth, 'MMM d, yyyy')} -{' '}
                {format(endOfMonth(firstDayCurrentMonth), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          {!isRangeMode && (
            <>
              <Button variant="outline" size="icon" className="hidden lg:flex">
                <SearchIcon size={16} strokeWidth={2} aria-hidden="true" />
              </Button>
              <Separator orientation="vertical" className="hidden h-6 lg:block" />
            </>
          )}

          <div className="inline-flex w-full -space-x-px rounded-lg shadow-sm shadow-black/5 md:w-auto rtl:space-x-reverse">
            <Button
              onClick={previousMonth}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
              variant="outline"
              size="icon"
              aria-label="Navigate to previous month"
            >
              <ChevronLeftIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button
              onClick={goToToday}
              className="w-full rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 md:w-auto"
              variant="outline"
            >
              Today
            </Button>
            <Button
              onClick={nextMonth}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
              variant="outline"
              size="icon"
              aria-label="Navigate to next month"
            >
              <ChevronRightIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>

          {!isRangeMode && (
            <>
              <Separator orientation="vertical" className="hidden h-6 md:block" />
              <Separator orientation="horizontal" className="block w-full md:hidden" />
              <Button className="w-full gap-2 md:w-auto">
                <PlusCircleIcon size={16} strokeWidth={2} aria-hidden="true" />
                <span>New Event</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="lg:flex lg:flex-auto lg:flex-col">
        <div className="grid grid-cols-7 border text-center text-xs font-semibold leading-6 lg:flex-none">
          <div className="border-r py-2.5">Sun</div>
          <div className="border-r py-2.5">Mon</div>
          <div className="border-r py-2.5">Tue</div>
          <div className="border-r py-2.5">Wed</div>
          <div className="border-r py-2.5">Thu</div>
          <div className="border-r py-2.5">Fri</div>
          <div className="py-2.5">Sat</div>
        </div>

        <div className="flex text-xs leading-6 lg:flex-auto">
          <div className="hidden w-full border-x lg:grid lg:grid-cols-7 lg:grid-rows-5">
            {days.map((day, dayIdx) =>
              !isDesktop ? (
                <button
                  onClick={() => handleDayClick(day)}
                  key={dayIdx}
                  type="button"
                  className={dayCellClass(day, true)}
                >
                  <time dateTime={format(day, 'yyyy-MM-dd')} className={dayNumberClass(day)}>
                    {format(day, 'd')}
                  </time>
                  {!isRangeMode &&
                    data.filter((date) => isSameDay(date.day, day)).length > 0 && (
                      <div>
                        {data
                          .filter((date) => isSameDay(date.day, day))
                          .map((date) => (
                            <div
                              key={date.day.toString()}
                              className="-mx-0.5 mt-auto flex flex-wrap-reverse"
                            >
                              {date.events.map((event) => (
                                <span
                                  key={event.id}
                                  className="mx-0.5 mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground"
                                />
                              ))}
                            </div>
                          ))}
                      </div>
                    )}
                </button>
              ) : (
                <div
                  key={dayIdx}
                  onClick={() => handleDayClick(day)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleDayClick(day)
                  }}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    dayIdx === 0 && colStartClasses[getDay(day)],
                    !isRangeMode &&
                      !isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      !isSameMonth(day, firstDayCurrentMonth) &&
                      'bg-accent/50 text-muted-foreground',
                    dayCellClass(day),
                    !isEqual(day, selectedDay) && 'hover:bg-accent/75',
                  )}
                >
                  <header className="flex items-center justify-between p-2.5">
                    <span className={dayNumberClass(day)}>
                      <time dateTime={format(day, 'yyyy-MM-dd')}>{format(day, 'd')}</time>
                    </span>
                  </header>
                  {!isRangeMode && (
                    <div className="flex-1 p-2.5">
                      {data
                        .filter((event) => isSameDay(event.day, day))
                        .map((dayData) => (
                          <div key={dayData.day.toString()} className="space-y-1.5">
                            {dayData.events.slice(0, 1).map((event) => (
                              <div
                                key={event.id}
                                className="flex flex-col items-start gap-1 rounded-lg border bg-muted/50 p-2 text-xs leading-tight"
                              >
                                <p className="font-medium leading-none">{event.name}</p>
                                <p className="leading-none text-muted-foreground">{event.time}</p>
                              </div>
                            ))}
                            {dayData.events.length > 1 && (
                              <div className="text-xs text-muted-foreground">
                                + {dayData.events.length - 1} more
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>

          <div className="isolate grid w-full grid-cols-7 grid-rows-5 border-x lg:hidden">
            {days.map((day, dayIdx) => (
              <button
                onClick={() => handleDayClick(day)}
                key={dayIdx}
                type="button"
                className={dayCellClass(day, true)}
              >
                <time dateTime={format(day, 'yyyy-MM-dd')} className={dayNumberClass(day)}>
                  {format(day, 'd')}
                </time>
                {!isRangeMode && data.filter((date) => isSameDay(date.day, day)).length > 0 && (
                  <div>
                    {data
                      .filter((date) => isSameDay(date.day, day))
                      .map((date) => (
                        <div
                          key={date.day.toString()}
                          className="-mx-0.5 mt-auto flex flex-wrap-reverse"
                        >
                          {date.events.map((event) => (
                            <span
                              key={event.id}
                              className="mx-0.5 mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground"
                            />
                          ))}
                        </div>
                      ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
